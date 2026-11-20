import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PLAN5 } from "./data.ts";
import { coachTips, repCeiling } from "./tips.ts";
import type { CheckIn, WorkoutLog } from "./storage.ts";

const today = "2026-11-20";
const friday = PLAN5[4];

function checkin(partial: Partial<CheckIn> & { date: string }): CheckIn {
  return { weight: "", steps: "", calories: "", ...partial };
}

function base() {
  return {
    today,
    plan: PLAN5,
    checkins: [] as CheckIn[],
    runs: [],
    workouts: [] as WorkoutLog[],
    todayPlan: friday,
  };
}

describe("coach tips", () => {
  it("reads the top of a rep range", () => {
    assert.equal(repCeiling("3 x 8-12"), 12);
    assert.equal(repCeiling("3 x 20-30 seconds"), null);
  });

  it("keeps only the two highest priorities", () => {
    const tips = coachTips({
      ...base(),
      checkins: [
        checkin({ date: "2026-11-20", sleepMinutes: "300", restingHr: "70", steps: "1000" }),
        checkin({ date: "2026-11-19", steps: "4000", calories: "3200" }),
        checkin({ date: "2026-11-18", restingHr: "60" }),
        checkin({ date: "2026-11-17", restingHr: "60" }),
      ],
      runs: [{ date: "2026-11-19", kind: "run" }],
    });
    assert.equal(tips.length, 2);
    assert.equal(tips[0].title, "Short sleep");
    assert.match(tips[0].reason, /5 h/);
    assert.equal(tips[1].title, "Resting heart rate is up");
    assert.match(tips[1].reason, /70 bpm/);
  });

  it("asks for an easy walk after a leg day", () => {
    const tips = coachTips({ ...base(), today: "2026-11-18", todayPlan: PLAN5[2] });
    assert.equal(tips[0].title, "Legs from yesterday");
    assert.match(tips[0].reason, /hip and quad/);
  });

  it("suggests more weight when every set hit the top", () => {
    const workouts: WorkoutLog[] = [
      {
        id: "1",
        date: "2026-11-13",
        label: "Friday",
        phase: "home",
        days: "5",
        updatedAt: "2026-11-13T12:00:00Z",
        exercises: [{ name: "Goblet squat, 3 seconds down", prescription: "3 x 10-12", sets: [{ weight: "30", reps: "12" }, { weight: "30", reps: "12" }, { weight: "30", reps: "12" }] }],
      },
    ];
    const tips = coachTips({ ...base(), workouts });
    assert.match(tips[0].title, /Goblet squat/);
    assert.match(tips[0].reason, /top of the rep range/);
  });

  it("adds a movement break after a low-step day", () => {
    const tips = coachTips({ ...base(), checkins: [checkin({ date: "2026-11-19", steps: "4500" })] });
    assert.equal(tips[0].title, "Low steps yesterday");
    assert.match(tips[0].reason, /4,500/);
  });

  it("protects food after a hard run", () => {
    const tips = coachTips({ ...base(), runs: [{ date: "2026-11-19", kind: "run" }] });
    assert.equal(tips[0].title, "Don't cut food");
    assert.match(tips[0].reason, /160 g/);
  });

  it("stays neutral when nothing fires", () => {
    const tips = coachTips({
      ...base(),
      checkins: [checkin({ date: "2026-11-19", steps: "9000", calories: "2200", sleepMinutes: "450", restingHr: "58" })],
    });
    assert.equal(tips.length, 1);
    assert.match(tips[0].reason, /Follow today's plan/);
  });
});
