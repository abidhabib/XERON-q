import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductTaskService, httpLink, taskReward } from '../services/productTasks.js';

function harness(options = {}) {
  const state = {
    user: { id: 1, approved: 1, balance: 0, backend_wallet: 100, task_product_ids: null, task_reward_per_product: 0, same_task_day: 0, mined_today: 0, reward_date: '2026-11-13', ...options.user },
    products: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, description: `Product ${i + 1}`, link: `https://example.com/${i + 1}`, imgLink: '/uploads/photo.jpg' })),
    clicks: [],
  };
  let previous = Promise.resolve();
  const pool = { async getConnection() {
    let unlock;
    const acquired = previous;
    previous = new Promise(resolve => { unlock = resolve; });
    await acquired;
    let snapshot;
    return {
      async beginTransaction() { snapshot = structuredClone(state); },
      async commit() { snapshot = null; },
      async rollback() { if (snapshot) Object.assign(state, snapshot); snapshot = null; },
      release() { unlock(); },
      async query(sql, args = []) {
        if (sql.includes('FROM users WHERE id')) { assert.match(sql, /FOR UPDATE/); return [[state.user].filter(Boolean).map(u => ({ ...u }))]; }
        if (sql.includes('FROM products')) return [structuredClone(state.products)];
        if (sql.includes('SET task_reward_date')) { Object.assign(state.user, { same_task_day: 1, task_reward_per_product: args[0], task_product_ids: args[1] }); return [{}]; }
        if (sql.includes('SELECT product_id')) return [state.clicks.map(product_id => ({ product_id }))];
        if (sql.includes('SET backend_wallet')) {
          if (state.user.backend_wallet < args[0]) return [{ affectedRows: 0 }];
          state.user.backend_wallet -= args[0]; state.user.balance += args[1]; return [{ affectedRows: 1 }];
        }
        if (sql.includes('INSERT INTO user_product_clicks')) {
          if (options.failClick) throw new Error('Simulated database failure');
          state.clicks.push(args[1]); return [{}];
        }
        throw new Error(`Unexpected SQL ${sql}`);
      },
    };
  } };
  return { state, tasks: createProductTaskService(pool) };
}

test('daily 10% rate stays fixed through all five tasks and wallet top-ups', async () => {
  const h = harness();
  const first = await h.tasks(1);
  assert.equal(first.reward_per_task, 2); assert.equal(first.daily_reward_total, 10);
  h.state.user.backend_wallet += 50;
  for (let id = 1; id <= 5; id++) {
    const result = await h.tasks(1, id);
    assert.equal(result.reward, 2); assert.equal(result.remaining_tasks, 5 - id);
  }
  assert.equal(h.state.user.balance, 10); assert.equal(h.state.user.backend_wallet, 140);
  assert.equal((await h.tasks(1)).daily_limit_reached, true);
});
test('concurrent duplicate claims pay only once', async () => {
  const h = harness();
  const results = await Promise.allSettled([h.tasks(1, 1), h.tasks(1, 1)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
  assert.equal(h.state.user.balance, 2); assert.deepEqual(h.state.clicks, [1]);
});
test('direct claims initialize the daily snapshot', async () => {
  const h = harness(); assert.equal((await h.tasks(1, 1)).reward, 2);
});
test('task click insertion failures roll back wallet and daily snapshot', async () => {
  const h = harness({ failClick: true });
  await assert.rejects(h.tasks(1, 1), /database failure/);
  assert.equal(h.state.user.balance, 0); assert.equal(h.state.user.backend_wallet, 100);
  assert.equal(h.state.user.same_task_day, 0);
});
test('disabled, new and unknown products cannot claim against a saved day', async () => {
  const h = harness(); await h.tasks(1);
  h.state.products = h.state.products.filter(p => p.id !== 1);
  h.state.products.push({ id: 6, link: 'https://example.com/new' });
  for (const id of [1, 6, 999]) await assert.rejects(h.tasks(1, id), /not available/);
  assert.equal((await h.tasks(1)).products.length, 4);
});
test('insufficient wallet or unapproved account cannot earn', async () => {
  const h = harness(); await h.tasks(1); h.state.user.backend_wallet = 1;
  await assert.rejects(h.tasks(1, 1), /Insufficient/);
  const blocked = harness({ user: { approved: 0 } });
  await assert.rejects(blocked.tasks(1), error => error.status === 403);
});
test('zero wallet does not freeze a zero reward after new funding', async () => {
  const h = harness({ user: { backend_wallet: 0 } });
  assert.equal((await h.tasks(1)).reward_per_task, 0);
  h.state.user.backend_wallet = 100;
  assert.equal((await h.tasks(1)).reward_per_task, 2);
});
test('empty product list does not initialize a daily snapshot', async () => {
  const h = harness(); h.state.products = [];
  assert.equal((await h.tasks(1)).allowed_tasks, 0); assert.equal(h.state.user.same_task_day, 0);
});
test('next day recalculates 10% of remaining backend', async () => {
  const h = harness(); await h.tasks(1, 1);
  h.state.user.same_task_day = 0; h.state.clicks = [];
  assert.equal((await h.tasks(1)).reward_per_task, 1.96);
});
test('legacy collection blocks another payout on migration day', async () => {
  const h = harness({ user: { mined_today: 1 } });
  assert.equal((await h.tasks(1)).daily_limit_reached, true);
  await assert.rejects(h.tasks(1, 1), /already collected/);
});
test('rates never exceed 10% at wallet precision', () => {
  for (const count of [1, 3, 7, 100]) assert.ok(taskReward(123.123456, count) * count <= 123.123456 * 0.1);
});
test('product URLs reject executable, credential-bearing or oversized values', () => {
  assert.equal(httpLink('javascript:alert(1)'), null); assert.equal(httpLink('https://user:pass@example.com'), null);
  assert.equal(httpLink('https://example.com/' + 'a'.repeat(300)), null);
  assert.equal(httpLink('https://example.com'), 'https://example.com/');
});
