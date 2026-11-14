import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductTaskSchemaInitializer } from '../services/productTaskSchema.js';
const columns = {
  products: ['active'], users: ['task_reward_date', 'task_reward_per_product', 'task_product_ids'], user_product_clicks: ['reward_amount'],
};
function database(initial, alterError) {
  const state = structuredClone(initial), writes = [];
  return { state, writes, async query(sql, args) {
    if (sql.startsWith('SHOW')) return [state[args[0]].map(Field => ({ Field }))];
    writes.push(args);
    if (alterError) throw Object.assign(new Error('Alter failed'), { code: alterError });
    state[args[0]].push(args[1]); return [{}];
  } };
}
test('existing schema needs no alterations', async () => {
  const db = database(columns); await createProductTaskSchemaInitializer(db)(); assert.equal(db.writes.length, 0);
});
test('partial migration adds only missing columns, including the reported field', async () => {
  const db = database({ ...columns, users: ['task_reward_date'] });
  await createProductTaskSchemaInitializer(db)();
  assert.deepEqual(db.writes, [['users', 'task_reward_per_product'], ['users', 'task_product_ids']]);
});
test('concurrent requests share one initialization and later requests skip DDL', async () => {
  const db = database({ products: [], users: [], user_product_clicks: [] });
  const ensure = createProductTaskSchemaInitializer(db);
  const first = ensure(); assert.equal(ensure(), first);
  await first; await ensure(); assert.equal(db.writes.length, 5);
});
test('permission errors propagate and initialization can retry', async () => {
  const db = database({ ...columns, users: [] }, 'ER_TABLEACCESS_DENIED_ERROR');
  const ensure = createProductTaskSchemaInitializer(db);
  await assert.rejects(ensure(), error => error.code === 'ER_TABLEACCESS_DENIED_ERROR');
  db.query = database(columns).query;
  await ensure();
});
test('a column added by another process is accepted', async () => {
  const db = database({ ...columns, users: ['task_reward_date', 'task_reward_per_product'] }, 'ER_DUP_FIELDNAME');
  await createProductTaskSchemaInitializer(db)(); assert.equal(db.writes.length, 1);
});
