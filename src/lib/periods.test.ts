import assert from "node:assert/strict";
import test from "node:test";
import { dateRangeForPeriod, isCivilDate } from "./periods";

test("calcula una semana de lunes a domingo", () => {
  assert.deepEqual(dateRangeForPeriod("2026-09-10", "week"), {
    start: "2026-09-07",
    end: "2026-09-13",
  });
});

test("calcula el trimestre natural", () => {
  assert.deepEqual(dateRangeForPeriod("2026-09-10", "quarter"), {
    start: "2026-07-01",
    end: "2026-09-30",
  });
});

test("acepta bisiestos y rechaza fechas imposibles", () => {
  assert.equal(isCivilDate("2028-02-29"), true);
  assert.equal(isCivilDate("2026-02-29"), false);
  assert.equal(isCivilDate("10/09/2026"), false);
});
