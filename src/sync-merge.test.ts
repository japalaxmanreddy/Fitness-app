import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeSync } from "./sync-merge.ts";
import { normalize } from "./storage.ts";

describe("sync merge", () => {
  it("keeps a typed weight and fills empty steps from Fitbit", () => {
    const merged = mergeSync(
      [{ date: "2026-11-01", weight: "190", steps: "", calories: "" }],
      [{ date: "2026-11-01", weightLb: 180, weightSource: "withings", steps: 9000, stepsSource: "fitbit" }],
    );
    assert.equal(merged.length, 1);
    assert.equal(merged[0].weight, "190");
    assert.equal(merged[0].weightSource, "manual");
    assert.equal(merged[0].steps, "9000");
    assert.equal(merged[0].stepsSource, "fitbit");
  });

  it("refreshes a device value without adding a second day", () => {
    const first = mergeSync([], [{ date: "2026-11-02", steps: 8000, stepsSource: "fitbit", fatPct: 24, bodySource: "withings" }]);
    const second = mergeSync(first, [{ date: "2026-11-02", steps: 8600, stepsSource: "fitbit" }]);
    assert.equal(second.length, 1);
    assert.equal(second[0].steps, "8600");
    assert.equal(second[0].fatPct, "24");
  });

  it("keeps older check-ins that already have a source", () => {
    const data = normalize({
      checkins: [{ date: "2026-11-01", weight: "191", steps: "1000", calories: "", fatPct: "22.5", weightSource: "withings" }],
      workouts: [],
    });
    assert.equal(data.checkins[0]?.fatPct, "22.5");
    assert.equal(data.checkins[0]?.weightSource, "withings");
  });
});
