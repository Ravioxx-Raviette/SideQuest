const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rollDiceValue } = require('../dist/roller.js');
test('D6 includes one and six at the accepted word boundaries', () => {
  assert.equal(rollDiceValue(6, () => 0), 1);
  assert.equal(rollDiceValue(6, () => 4294967291), 6);
});
test('D20 includes one and twenty at the accepted word boundaries', () => {
  assert.equal(rollDiceValue(20, () => 0), 1);
  assert.equal(rollDiceValue(20, () => 4294967279), 20);
});
test('rejection sampling discards the excess word range before producing a result', () => {
  const words = [4294967295, 7];
  assert.equal(rollDiceValue(20, () => words.shift()), 8);
  assert.equal(words.length, 0);
});
test('unsupported dice and invalid random words are rejected', () => {
  assert.throws(() => rollDiceValue(12, () => 0), RangeError);
  assert.throws(() => rollDiceValue(6, () => -1), RangeError);
});
