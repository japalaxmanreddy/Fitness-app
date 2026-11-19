import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { energyNeeds, proteinGrams } from "./calc.ts";
import {
  GYM5,
  LIB,
  PLAN3,
  PLAN4,
  PLAN5,
  STRETCHES,
  matchExercise,
  planWeight,
} from "./data.ts";
import { prescribedSets } from "./log.ts";
import { ANIM_KEYS, ANIMS, animFor } from "./motion.ts";
import { normalize } from "./storage.ts";
import { youtubeId } from "./youtube-id.ts";

describe("daily targets", () => {
  it("uses Mifflin-St Jeor, the activity factor, and a 500 calorie cut", () => {
    const energy = energyNeeds({ weight: "195", height: "71", age: "36", sex: "male", activity: "desk" });
    assert.deepEqual(energy, { maint: 2570, target: 2070 });
  });

  it("floors the cut for a smaller person", () => {
    const energy = energyNeeds({ weight: "140", height: "64", age: "30", sex: "female", activity: "feet" });
    assert.deepEqual(energy, { maint: 2210, target: 1710 });
  });

  it("rejects empty body stats", () => {
    assert.equal(energyNeeds({ weight: "", height: "71", age: "36", sex: "male", activity: "desk" }), null);
  });

  it("rounds protein to about 0.82 g per lb", () => {
    assert.deepEqual(proteinGrams("195"), { protein: 160, low: 140, high: 180 });
    assert.deepEqual(proteinGrams(""), { protein: 160, low: 140, high: 180 });
  });
});

describe("plans and library", () => {
  it("keeps every exercise, stretch, and weekly plan", () => {
    assert.equal(LIB.length, 27);
    assert.equal(STRETCHES.length, 8);
    assert.equal(PLAN3.length, 4);
    assert.equal(PLAN4.length, 5);
    assert.equal(PLAN5.length, 6);
    assert.equal(GYM5.length, 6);
    for (const exercise of LIB) {
      assert.equal(typeof exercise.videoUrl, "string");
      assert.ok(exercise.cue && exercise.arm && exercise.muscles);
      assert.ok(ANIMS[animFor(exercise.name)]);
    }
    for (const stretch of STRETCHES) {
      assert.equal(typeof stretch.videoUrl, "string");
      assert.ok(ANIMS[animFor(stretch.name)]);
    }
  });

  it("draws the 18 week line from 195 to 177", () => {
    assert.equal(planWeight(0), 195);
    assert.equal(planWeight(8), 187);
    assert.equal(planWeight(18), 177);
    assert.equal(planWeight(40), 177);
  });

  it("matches plan rows back to library demos", () => {
    assert.equal(matchExercise("Goblet squat, 3 seconds down")?.name, "Goblet squat");
    assert.equal(matchExercise("Dumbbell Romanian deadlift, straps OK")?.name, "Dumbbell Romanian deadlift");
    assert.equal(matchExercise("Leg press, high reps")?.name, "Leg press (gym)");
    assert.equal(matchExercise("Chest-supported row machine")?.name, "Chest-supported dumbbell row");
    assert.equal(matchExercise("Hip thrust, machine or barbell")?.name, "Hip thrust on bench");
    assert.equal(matchExercise("Bike, intervals")?.name, "Bike, intervals");
    assert.equal(matchExercise("Bike, easy warm-up")?.name, "Bike, steady");
    assert.equal(matchExercise("Full stretch routine"), undefined);
  });
});

describe("animations", () => {
  it("includes every stick-figure clip", () => {
    for (const key of ANIM_KEYS) {
      const clip = ANIMS[key];
      assert.ok(clip);
      for (const pose of [clip.a, clip.b]) {
        for (const point of [pose.h, pose.s, pose.p, pose.e, pose.w, pose.k, pose.f]) {
          assert.equal(point.length, 2);
          assert.ok(point.every((value) => Number.isFinite(value)));
        }
      }
    }
    assert.equal(animFor("Seated dumbbell shoulder press"), "ohp");
    assert.equal(animFor("Pallof press (gym)"), "pallof");
    assert.equal(animFor("Single-leg Romanian deadlift"), "singleHinge");
    assert.equal(animFor("Side plank on forearm"), "sideplank");
    assert.equal(animFor("Gentle forearm flexor and extensor stretch"), "forearm");
    assert.equal(animFor("Figure-4 glute stretch"), "lying");
    assert.equal(animFor("Cat-cow"), "catcow");
  });
});

describe("logging helpers", () => {
  it("reads the set count from a prescription", () => {
    assert.equal(prescribedSets("3 x 8-12").length, 3);
    assert.equal(prescribedSets("4 x 8-12").length, 4);
    assert.equal(prescribedSets("2 x stop 2 reps short of failure").length, 2);
    assert.equal(prescribedSets("15 min").length, 1);
    assert.equal(prescribedSets("6-8 rounds of 30 sec hard, 90 sec easy").length, 1);
  });

  it("accepts a backup and fills defaults", () => {
    const data = normalize({
      profile: { weight: "190", theme: "dark" },
      checkins: [{ date: "2026-11-01", weight: 191, steps: "8000", calories: "" }],
      workouts: [],
    });
    assert.equal(data.profile.weight, "190");
    assert.equal(data.profile.theme, "dark");
    assert.equal(data.profile.sex, "male");
    assert.equal(data.checkins[0]?.weight, "191");
    assert.equal(data.checkins[0]?.steps, "8000");
  });
});

describe("youtube slots", () => {
  it("reads a video id for the nocookie embed", () => {
    assert.equal(youtubeId(""), null);
    assert.equal(youtubeId("https://www.youtube.com/watch?v=abc123XYZ_0"), "abc123XYZ_0");
    assert.equal(youtubeId("https://youtu.be/abc123XYZ_0"), "abc123XYZ_0");
    assert.equal(youtubeId("https://www.youtube.com/embed/abc123XYZ_0"), "abc123XYZ_0");
  });
});
