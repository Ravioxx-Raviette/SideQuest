const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchDice } = require('../dist/finder.js');
const products = [
  { id: 'single', type: 'D20', material: 'Resin', price: 180 },
  { id: 'metal', type: 'D20', material: 'Metal', price: 480 },
  { id: 'rose', type: 'Set', material: 'Resin', price: 550 },
  { id: 'star', type: 'Set', material: 'Resin', price: 650 },
  { id: 'copper', type: 'Set', material: 'Metal', price: 1250 },
  { id: 'classic', type: 'D6', material: 'Acrylic', price: 90 },
];

test('a first campaign within 700 only recommends affordable full sets', () => {
  const result = matchDice(products, { type: 'Set', budget: 700, material: 'any' });
  assert.deepEqual(result.map(({ product }) => product.id), ['rose', 'star']);
});
test('a tight set budget yields no matches rather than singles or expensive sets', () => {
  assert.deepEqual(matchDice(products, { type: 'Set', budget: 250, material: 'Metal' }), []);
});
test('material preference ranks first without excluding affordable alternatives', () => {
  const result = matchDice(products, { type: 'D20', budget: 500, material: 'Metal' });
  assert.deepEqual(result.map(({ product }) => product.id), ['metal', 'single']);
  assert.deepEqual(result.map(({ materialMatch }) => materialMatch), [true, false]);
});
test('budget boundary is inclusive and any material is not a claimed match', () => {
  const result = matchDice(products, { type: 'D20', budget: 180, material: 'any' });
  assert.equal(result.length, 1);
  assert.equal(result[0].product.id, 'single');
  assert.equal(result[0].materialMatch, false);
});
test('exploring any type returns up to three affordable products ordered by preference and price', () => {
  const result = matchDice(products, { type: 'any', budget: Infinity, material: 'Metal' });
  assert.deepEqual(result.map(({ product }) => product.id), ['metal', 'copper', 'classic']);
  assert.equal(products[0].id, 'single');
});
