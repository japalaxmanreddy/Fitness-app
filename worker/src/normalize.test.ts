import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { combineDays, kgToLb, parseWithingsMeasures, withingsValue } from "./normalize.ts";

describe("withings numbers", () => {
  it("applies the unit exponent and converts kilograms to pounds", () => {
    assert.equal(withingsValue(80000, -3), 80);
    const days = parseWithingsMeasures({
      measuregrps: [{ date: Date.parse("2026-11-03T12:00:00Z") / 1000, measures: [{ type: 1, value: 80000, unit: -3 }, { type: 6, value: 240, unit: -1 }] }],
    });
    const day = days.get("2026-11-03");
    assert.equal(day?.weightKg, 80);
    assert.equal(day?.fatPct, 24);
    assert.ok(Math.abs(kgToLb(80) - 176.368) < 0.01);
  });

  it("prefers Withings weight and Fitbit steps", () => {
    const days = combineDays({
      withingsMeasures: new Map([["2026-11-04", { weightKg: 88 }]]),
      withingsActivity: new Map([["2026-11-04", { steps: 1000, calories: 100 }]]),
      withingsSleep: new Map(),
      fitbitSteps: new Map([["2026-11-04", 9000]]),
      fitbitCalories: new Map([["2026-11-04", 2200]]),
      fitbitFairly: new Map([["2026-11-04", 20]]),
      fitbitVery: new Map([["2026-11-04", 10]]),
      fitbitHeart: new Map([["2026-11-04", 61]]),
      fitbitSleep: new Map([["2026-11-04", 420]]),
      fitbitWeight: new Map([["2026-11-04", 200]]),
    });
    assert.equal(days.length, 1);
    assert.equal(days[0].weightSource, "withings");
    assert.equal(days[0].steps, 9000);
    assert.equal(days[0].stepsSource, "fitbit");
    assert.equal(days[0].activeMinutes, 30);
    assert.equal(days[0].restingHr, 61);
    assert.equal(days[0].sleepMinutes, 420);
  });
});
