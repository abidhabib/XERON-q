import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const controllerUrl = new URL('../controllers/GetUserWalletController.js', import.meta.url);
const source = await readFile(controllerUrl, 'utf8');
const address = `0x${'a'.repeat(40)}`;

// Load the production controller with an isolated database dependency. Never open MySQL.
async function harness({ rows = [], databaseError = null } = {}) {
  const calls = [];
  const database = {
    query(sql, params, callback) {
      calls.push({ sql, params: Array.from(params) });
      callback(databaseError, sql.includes('INSERT INTO') ? { affectedRows: 1 } : rows);
    },
  };
  const context = createContext({ console: { error() {}, warn() {}, log() {} } });
  const dependency = new SyntheticModule(['default'], function () {
    this.setExport('default', database);
  }, { context });
  const module = new SourceTextModule(source, { context, identifier: controllerUrl.href });
  await module.link(specifier => {
    assert.equal(specifier, '../config/db.js');
    return dependency;
  });
  await module.evaluate();
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return { ...Object.fromEntries(Object.entries(module.namespace)), calls, response };
}

test('wallet reads require a session even when a client supplies a user ID', async () => {
  const h = await harness();
  h.getUserWallets({ params: { userId: 99 } }, h.response);
  assert.equal(h.response.statusCode, 401);
  assert.equal(h.response.body.success, false);
  assert.equal(h.calls.length, 0);
});

test('wallet writes check authentication before reading a missing request body', async () => {
  const h = await harness();
  h.saveWalletAddress({ session: {} }, h.response);
  assert.equal(h.response.statusCode, 401);
  assert.equal(h.calls.length, 0);
});

test('wallet reads use the session owner rather than the legacy URL parameter', async () => {
  const h = await harness({ rows: [{ chain: 'bep20', address }] });
  h.getUserWallets({ session: { userId: 7 }, params: { userId: 99 } }, h.response);
  assert.equal(h.response.statusCode, 200);
  assert.deepEqual(h.calls[0].params, [7]);
  assert.match(h.calls[0].sql, /WHERE user_id = \?/);
  assert.equal(h.response.body.wallets.bep20, address);
});

test('wallet saves ignore client-supplied ownership and normalize valid input', async () => {
  const h = await harness();
  h.saveWalletAddress({
    session: { userId: 7 }, params: { userId: 99 },
    body: { userId: 99, user_id: 99, chain: ' BEP20 ', address: ` ${address} ` },
  }, h.response);
  assert.equal(h.response.statusCode, 200);
  assert.equal(h.response.body.success, true);
  assert.deepEqual(h.calls[0].params, [7, 'bep20', address]);
});

test('missing or non-string wallet fields return 400 without touching the database', async () => {
  const invalidBodies = [
    undefined, null, {}, { chain: 'bep20' }, { address },
    { chain: {}, address }, { chain: 1, address }, { chain: [], address },
    { chain: 'bep20', address: {} }, { chain: 'bep20', address: 1 },
    { chain: 'bep20', address: [] }, { chain: '  ', address },
    { chain: 'bep20', address: '   ' },
  ];
  for (const body of invalidBodies) {
    const h = await harness();
    h.saveWalletAddress({ session: { userId: 7 }, body }, h.response);
    assert.equal(h.response.statusCode, 400);
    assert.equal(h.calls.length, 0);
  }
});

test('unsupported chains, invalid addresses and oversized addresses cannot be saved', async () => {
  for (const body of [
    { chain: 'unsupported', address },
    { chain: 'bep20', address: 'invalid' },
    { chain: 'bep20', address: 'a'.repeat(201) },
  ]) {
    const h = await harness();
    h.saveWalletAddress({ session: { userId: 7 }, body }, h.response);
    assert.equal(h.response.statusCode, 400);
    assert.equal(h.calls.length, 0);
  }
});

test('database failures return generic errors for reads and writes', async () => {
  for (const method of ['getUserWallets', 'saveWalletAddress']) {
    const h = await harness({ databaseError: new Error('private database detail') });
    h[method]({ session: { userId: 7 }, body: { chain: 'bep20', address } }, h.response);
    assert.equal(h.response.statusCode, 500);
    assert.equal(h.response.body.success, false);
    assert.doesNotMatch(h.response.body.error, /private database detail/);
  }
});
