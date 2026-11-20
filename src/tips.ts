import type { PlanDay } from "./data.ts";
import { addDays, diffDays, parseISODate } from "./dates.ts";
import { lastPerformance } from "./log.ts";
import { isLegDay } from "./runs.ts";
import { suggestedDay } from "./data.ts";
import { workoutRows } from "./day-plan.ts";
import type { CheckIn, WorkoutLog } from "./storage.ts";
import type { RunLog } from "./runs.ts";

export type Tip = { title: string; reason: string };

const SLEEP_LIMIT_MIN = 6.5 * 60;
const STEP_LIMIT = 6000;
const HR_GAP = 5;
const BIG_BURN_GAP = 400;
const BIG_BURN_FLOOR = 2800;

export function repCeiling(prescription: string): number | null {
  if (/sec|min\b|hold/i.test(prescription)) return null;
  const range = /(\d+)\s*-\s*(\d+)/.exec(prescription);
  if (range) return Number(range[2]);
  const single = /\bx\s*(\d+)\b/i.exec(prescription);
  return single ? Number(single[1]) : null;
}

function hours(minutes: number): string {
  const value = Math.round((minutes / 60) * 10) / 10;
  return `${value} h`;
}

function readyLifts(todayPlan: PlanDay | null, workouts: WorkoutLog[], today: string): string[] {
  if (!todayPlan) return [];
  const names: string[] = [];
  for (const [name, prescription] of workoutRows(todayPlan)) {
    const ceiling = repCeiling(prescription);
    if (ceiling === null) continue;
    const last = lastPerformance(workouts, name);
    if (!last || last.date >= today) continue;
    const reps = last.sets.map((set) => Number(set.reps)).filter((value) => Number.isFinite(value) && value > 0);
    if (reps.length > 0 && reps.every((value) => value >= ceiling)) names.push(name);
  }
  return names;
}

export function coachTips(input: {
  today: string;
  plan: PlanDay[];
  checkins: CheckIn[];
  runs: Pick<RunLog, "date" | "kind">[];
  workouts: WorkoutLog[];
  todayPlan: PlanDay | null;
}): Tip[] {
  const yesterday = addDays(input.today, -1);
  const byDate = new Map(input.checkins.map((item) => [item.date, item]));
  const tips: Tip[] = [];

  const night = byDate.get(input.today)?.sleepMinutes || byDate.get(yesterday)?.sleepMinutes || "";
  const nightMinutes = Number(night);
  if (Number.isFinite(nightMinutes) && nightMinutes > 0 && nightMinutes < SLEEP_LIMIT_MIN) {
    tips.push({
      title: "Short sleep",
      reason: `Last night was ${hours(nightMinutes)}. Cut one set from each exercise and keep the evening run easy.`,
    });
  }

  const todayHr = Number(byDate.get(input.today)?.restingHr);
  const priorHr = input.checkins
    .filter((item) => {
      const ago = diffDays(item.date, input.today);
      return ago >= 1 && ago <= 7 && Number(item.restingHr) > 0;
    })
    .map((item) => Number(item.restingHr));
  if (Number.isFinite(todayHr) && todayHr > 0 && priorHr.length >= 2) {
    const average = priorHr.reduce((sum, value) => sum + value, 0) / priorHr.length;
    if (todayHr >= average + HR_GAP) {
      tips.push({
        title: "Resting heart rate is up",
        reason: `Today is ${Math.round(todayHr)} bpm, ${Math.round(todayHr - average)} above the recent average of ${Math.round(average)}. Keep the day lighter and walk instead of a hard run.`,
      });
    }
  }

  const yesterdayPlan = suggestedDay(input.plan, parseISODate(yesterday));
  if (yesterdayPlan && isLegDay(yesterdayPlan)) {
    tips.push({
      title: "Legs from yesterday",
      reason: `Yesterday was ${yesterdayPlan.day}. Add a 5-minute hip and quad stretch, and keep tonight's walk easy.`,
    });
  }

  const lifts = readyLifts(input.todayPlan, input.workouts, input.today);
  if (lifts.length > 0) {
    const extra = lifts.length > 1 ? ` and ${lifts.length - 1} more` : "";
    tips.push({
      title: `Go up on ${lifts[0]}${extra}`,
      reason: "Last time, every set hit the top of the rep range. Add a little weight on that lift today.",
    });
  }

  const steps = Number(byDate.get(yesterday)?.steps);
  if (Number.isFinite(steps) && steps > 0 && steps < STEP_LIMIT) {
    tips.push({
      title: "Low steps yesterday",
      reason: `Yesterday was ${Math.round(steps).toLocaleString()} steps. Add one extra movement break today.`,
    });
  }

  const hardRun = input.runs.some((run) => run.date === yesterday && run.kind === "run");
  const burned = Number(byDate.get(yesterday)?.calories);
  const otherBurns = input.checkins
    .filter((item) => item.date !== yesterday && diffDays(item.date, input.today) >= 0 && diffDays(item.date, input.today) <= 7 && Number(item.calories) > 0)
    .map((item) => Number(item.calories));
  const burnAverage = otherBurns.length ? otherBurns.reduce((sum, value) => sum + value, 0) / otherBurns.length : null;
  const bigBurn = Number.isFinite(burned) && burned > 0 && (burnAverage === null ? burned >= BIG_BURN_FLOOR : burned >= burnAverage + BIG_BURN_GAP);
  if (hardRun || bigBurn) {
    const why = hardRun
      ? "Yesterday included a run."
      : `Yesterday burned ${Math.round(burned).toLocaleString()} calories.`;
    tips.push({
      title: "Don't cut food",
      reason: `${why} Aim for 160 g of protein and don't cut food today.`,
    });
  }

  if (tips.length === 0) {
    const name = input.todayPlan?.day ?? "Rest day";
    return [
      {
        title: name,
        reason: input.todayPlan
          ? "Nothing in yesterday's numbers calls for a change. Follow today's plan as written."
          : "No workout is scheduled. An easy walk is enough.",
      },
    ];
  }
  return tips.slice(0, 2);
}
