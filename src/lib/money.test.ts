import assert from "node:assert/strict";
import test from "node:test";
import { amountToCents, centsToInput, signedAmountToCents } from "./money";

test("convierte importes con coma o punto a céntimos", () => {
  assert.equal(amountToCents("12,45"), 1245);
  assert.equal(amountToCents("9.5"), 950);
  assert.equal(centsToInput(1245), "12.45");
});

test("admite saldo actual negativo", () => {
  assert.equal(signedAmountToCents("-125,50"), -12550);
  assert.equal(signedAmountToCents("0"), 0);
});

test("rechaza cero, negativos y más de dos decimales", () => {
  assert.throws(() => amountToCents("0"));
  assert.throws(() => amountToCents("-3"));
  assert.throws(() => amountToCents("4.123"));
});
