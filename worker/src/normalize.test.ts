import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { combineDays, kgToLb, parseFitbitActivities, parseWithingsMeasures, withingsValue } from "./normalize.ts";
import { withingsHosts } from "./withings-hosts.ts";

describe("withings region", () => {
  it("uses the US Medical Cloud unless the region is eu", () => {
    assert.equal(withingsHosts("us").authorize, "https://account.us.withingsmed.com/oauth2_user/authorize2");
    assert.equal(withingsHosts(undefined).api, "https://wbsapi.us.withingsmed.net");
    assert.equal(withingsHosts("eu").authorize, "https://account.withings.com/oauth2_user/authorize2");
    assert.equal(withingsHosts("eu").api, "https://wbsapi.withings.net");
  });
});

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

describe("fitbit activity list", () => {
  it("keeps run and walk entries and converts kilometers", () => {
    const activities = parseFitbitActivities({
      activities: [
        {
          logId: 99,
          activityName: "Run",
          startTime: "2026-11-18T18:05:00.000-05:00",
          duration: 1800000,
          distance: 5,
          distanceUnit: "Kilometer",
          averageHeartRate: 150,
          calories: 320,
          steps: 4200,
          elevationGain: 12,
          heartRateZones: [
            { name: "Out of Range", minutes: 1 },
            { name: "Fat Burn", minutes: 10 },
            { name: "Cardio", minutes: 18 },
            { name: "Peak", minutes: 1 },
          ],
        },
        {
          logId: 100,
          activityName: "Bike",
          startTime: "2026-11-18T12:00:00.000-05:00",
          duration: 600000,
          distance: 3,
          distanceUnit: "Kilometer",
        },
        {
          logId: 101,
          activityName: "Outdoor Walk",
          startTime: "2026-11-17T07:30:00.000-05:00",
          duration: 1200000,
          distance: 1.5,
          distanceUnit: "Mile",
          averageHeartRate: 110,
        },
      ],
    });
    assert.equal(activities.length, 2);
    assert.equal(activities[0].kind, "run");
    assert.equal(activities[0].date, "2026-11-18");
    assert.equal(activities[0].start, "18:05");
    assert.equal(activities[0].durationMin, 30);
    assert.equal(activities[0].distanceMi, 3.11);
    assert.equal(activities[0].avgHr, 150);
    assert.equal(activities[0].calories, 320);
    assert.equal(activities[0].steps, 4200);
    assert.equal(activities[0].elevationFt, 39);
    assert.equal(activities[0].zones?.cardio, 18);
    assert.equal(activities[1].kind, "walk");
    assert.equal(activities[1].distanceMi, 1.5);
  });
});
