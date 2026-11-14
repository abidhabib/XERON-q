import test from 'node:test';
import assert from 'node:assert/strict';
import { shareProduct, productUrl, productImage } from './productShare.js';
const product = { id: 1, link: 'https://example.com/product?a=1&b=2', description: 'A useful product' };
test('native sharing opens immediately from the tap with link and supported photo', async () => {
  let data; const photo = {};
  const pending = shareProduct(product, { navigator: { share: async d => { data = d; }, canShare: () => true } }, photo);
  assert.equal(data.url, product.link); assert.deepEqual(data.files, [photo]);
  assert.equal(await pending, 'shared');
});
test('cancelling native sharing does not count as a share', async () => {
  assert.equal(await shareProduct(product, { navigator: { share: async () => { throw { name: 'AbortError' }; } } }), 'cancelled');
});
test('unsupported browsers report an error without a custom share flow', async () => {
  await assert.rejects(shareProduct(product, { navigator: {} }), /Phone sharing is unavailable/);
});
test('permission failures do not count as shares', async () => {
  await assert.rejects(shareProduct(product, { navigator: { share: async () => { throw { name: 'NotAllowedError' }; } } }), /Sharing could not open/);
});
test('unsupported photos use native link sharing', async () => {
  let data;
  await shareProduct(product, { navigator: { share: async d => { data = d; }, canShare: () => false } }, {});
  assert.equal(data.url, product.link); assert.equal(data.files, undefined);
});
test('invalid links never reach the phone share API', async () => {
  let opened = false;
  assert.equal(productUrl('javascript:alert(1)'), null);
  await assert.rejects(shareProduct({ link: 'javascript:alert(1)' }, { navigator: { share: async () => { opened = true; } } }), /valid/);
  assert.equal(opened, false);
  assert.equal(productImage('/uploads/products/p.jpg', 'https://api.example.com'), 'https://api.example.com/uploads/products/p.jpg');
});
