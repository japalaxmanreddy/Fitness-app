import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PLAN3, PLAN4, PLAN5 } from "./data.ts";
import {
  EASY_HR_LIMIT,
  buildLadder,
  easyHrHigh,
  eveningCopy,
  eveningPlans,
  fitnessNote,
  fitnessTrend,
  mergeRuns,
  normalizeRun,
  roadStatus,
  type RunLog,
} from "./runs.ts";
import { describeWeek, weeklyAverages, type WeekAverage } from "./weight-trend.ts";

function run(partial: Partial<RunLog> & Pick<RunLog, "id" | "date" | "distanceMi">): RunLog {
  return {
    start: "18:00",
    durationMin: 30,
    kind: "walk",
    source: "manual",
    ...partial,
  };
}

describe("road to 5 miles", () => {
  it("grows weekly miles by at most 10 percent and lightens every 4th week", () => {
    const ladder = buildLadder();
    assert.equal(ladder[0].weeklyMiles, 14);
    assert.equal(ladder[0].sessionMiles, 2);
    assert.equal(ladder.at(-1)?.weeklyMiles, 35);
    assert.ok(ladder.every((week) => week.sessionMiles <= 5));
    assert.ok(ladder.every((week) => week.hardRunMiles <= 3 && week.hardRunMiles <= week.sessionMiles + 0.001));
    assert.equal(ladder[3].recovery, true);
    assert.equal(ladder[3].weeklyMiles, Math.round(ladder[2].weeklyMiles * 0.8 * 10) / 10);
    const builds = ladder.filter((week) => !week.recovery);
    for (let index = 1; index < builds.length; index += 1) {
      const cap = Math.round(builds[index - 1].weeklyMiles * 1.1 * 10) / 10;
      assert.ok(builds[index].weeklyMiles <= cap + 0.001);
    }
    const goal = ladder.find((week) => week.weeklyMiles === 35);
    assert.ok(goal);
    assert.equal(goal.sessionMiles, 5);
    assert.equal(goal.hardRunMiles, 3);
    assert.equal(goal.hardStyle, "continuous");
    assert.equal(ladder[0].hardStyle, "intervals");
  });

  it("keeps leg-day evenings and the night before as easy walks", () => {
    const plan5 = eveningPlans(PLAN5);
    assert.equal(plan5.filter((night) => night.kind === "hard").length, 3);
    assert.equal(plan5[1].kind, "easy-walk");
    assert.match(plan5[1].note, /fresh for leg day/);
    assert.equal(plan5[2].kind, "easy-walk");
    assert.match(plan5[2].note, /legs recovering/);
    assert.equal(plan5[3].kind, "hard");
    assert.equal(plan5[4].kind, "easy-walk");
    assert.equal(plan5[5].kind, "easy-walk");
    assert.match(plan5[5].note, /legs recovering/);
    for (const plan of [PLAN3, PLAN4, PLAN5]) {
      const nights = eveningPlans(plan);
      nights.forEach((night, index) => {
        const tomorrow = nights[(index + 1) % 7];
        if (night.todayLeg || tomorrow.todayLeg) assert.equal(night.kind, "easy-walk");
      });
    }
    const plan3 = eveningPlans(PLAN3);
    assert.equal(plan3[6].kind, "hard");
    assert.equal(plan3[0].kind, "easy-walk");
    assert.match(plan3[0].note, /fresh for leg day/);
  });

  it("repeats a ladder week after a large miss and advances after 80 percent", () => {
    const short = [run({ id: "a", date: "2026-11-02", distanceMi: 5 })];
    const held = roadStatus(short, "2026-11-09");
    assert.equal(held.index, 0);
    assert.equal(held.repeating, true);
    assert.equal(held.attempts[0]?.met, false);
    const caught = roadStatus(
      [...short, run({ id: "b", date: "2026-11-09", distanceMi: 14 * 0.8 })],
      "2026-11-16",
    );
    assert.equal(caught.attempts[1]?.met, true);
    assert.equal(caught.index, 1);
    assert.equal(caught.repeating, false);
  });

  it("puts the week target and the leg note on the evening item", () => {
    const monday = PLAN5[0];
    const move = eveningCopy(PLAN5, monday, [], "2026-11-16");
    assert.match(move.name, /Easy/);
    assert.match(move.prescription, /fresh for leg day/);
    assert.match(move.prescription, /2\.0 mi/);
    assert.match(move.cue, new RegExp(String(EASY_HR_LIMIT)));
  });
});

describe("run logs", () => {
  it("keeps a manual entry ahead of a Fitbit duplicate", () => {
    const manual = run({ id: "manual:1", date: "2026-11-18", start: "18:00", distanceMi: 2, source: "manual" });
    const synced = {
      id: "fitbit:9",
      date: "2026-11-18",
      start: "18:12",
      distanceMi: 2.1,
      durationMin: 27,
      kind: "run" as const,
      avgHr: 150,
    };
    const other = { ...synced, id: "fitbit:10", date: "2026-11-19", start: "07:00", distanceMi: 3 };
    const merged = mergeRuns([manual], [synced, other], "2026-10-01");
    assert.equal(merged.some((item) => item.id === "fitbit:9"), false);
    assert.equal(merged.some((item) => item.id === "manual:1"), true);
    assert.equal(merged.some((item) => item.id === "fitbit:10"), true);
    const again = mergeRuns(merged, [{ ...synced, distanceMi: 4 }], "2026-10-01");
    assert.equal(again.some((item) => item.id === "fitbit:9"), false);
    assert.equal(again.find((item) => item.id === "manual:1")?.distanceMi, 2);
  });

  it("flags an easy night over about 145 bpm and reads a saved run", () => {
    const easy = run({ id: "e", date: "2026-11-17", distanceMi: 2, kind: "walk", avgHr: 150 });
    const hard = run({ id: "h", date: "2026-11-18", distanceMi: 2, kind: "run", avgHr: 160 });
    assert.equal(easyHrHigh(easy, "easy-walk"), true);
    assert.equal(easyHrHigh({ ...easy, avgHr: 140 }, "easy-walk"), false);
    assert.equal(easyHrHigh(hard, "hard"), false);
    const stored = normalizeRun({ ...easy, source: "manual" });
    assert.equal(stored?.avgHr, 150);
    assert.equal(normalizeRun({ ...easy, distanceMi: 0 }), null);
  });

  it("tracks heart rate at a similar pace", () => {
    const runs = [
      run({ id: "1", date: "2026-11-02", distanceMi: 2, durationMin: 20, kind: "run", avgHr: 155 }),
      run({ id: "2", date: "2026-11-09", distanceMi: 2, durationMin: 20, kind: "run", avgHr: 148 }),
    ];
    const trend = fitnessTrend(runs);
    assert.ok(trend);
    assert.equal(trend.points.length, 2);
    assert.ok(trend.points[1].hr < trend.points[0].hr);
    assert.match(fitnessNote(trend.points), /improving/);
  });
});

describe("weekly weight average", () => {
  it("flags a drop faster than 1.5 lb and two rising weeks", () => {
    const down: WeekAverage[] = [
      { weekStart: "2026-11-02", average: 195, count: 2 },
      { weekStart: "2026-11-09", average: 193, count: 2 },
    ];
    assert.equal(describeWeek(down).flag, "fast");
    const up: WeekAverage[] = [
      { weekStart: "2026-10-26", average: 190, count: 2 },
      { weekStart: "2026-11-02", average: 191, count: 2 },
      { weekStart: "2026-11-09", average: 192, count: 2 },
    ];
    assert.equal(describeWeek(up).flag, "up");
    assert.equal(weeklyAverages([{ date: "2026-11-03", lb: 190 }, { date: "2026-11-04", lb: 192 }])[0]?.average, 191);
  });
});
