import type { CheckIn, MetricSource } from "./storage";

export type DeviceName = "withings" | "fitbit";

export type SyncedDay = {
  date: string;
  weightLb?: number;
  fatPct?: number;
  muscleLb?: number;
  bmi?: number;
  steps?: number;
  calories?: number;
  activeMinutes?: number;
  restingHr?: number;
  sleepMinutes?: number;
  weightSource?: DeviceName;
  stepsSource?: DeviceName;
  caloriesSource?: DeviceName;
  bodySource?: DeviceName;
  activitySource?: DeviceName;
  sleepSource?: DeviceName;
};

function roundTo(value: number, places: number): string {
  const factor = 10 ** places;
  return String(Math.round(value * factor) / factor);
}

function incomingText(value: number | undefined, places: number): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  return roundTo(value, places);
}

function keepManual(
  current: string,
  source: MetricSource | undefined,
  incoming: string,
  incomingSource: MetricSource | undefined,
): { value: string; source: MetricSource | undefined } {
  const filled = current.trim() !== "";
  const manual = source === "manual" || (filled && source === undefined);
  if (filled && manual) return { value: current, source: "manual" };
  if (incoming && incomingSource) return { value: incoming, source: incomingSource };
  return { value: current, source };
}

function keepDeviceMetric(current: string | undefined, incoming: string): string | undefined {
  if (incoming) return incoming;
  return current;
}

export function mergeSync(checkins: CheckIn[], days: SyncedDay[]): CheckIn[] {
  const byDate = new Map<string, CheckIn>();
  for (const item of checkins) byDate.set(item.date, { ...item });
  for (const day of days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) continue;
    const current = byDate.get(day.date) ?? { date: day.date, weight: "", steps: "", calories: "" };
    const weight = keepManual(current.weight, current.weightSource, incomingText(day.weightLb, 1), day.weightSource);
    const steps = keepManual(current.steps, current.stepsSource, incomingText(day.steps, 0), day.stepsSource);
    const calories = keepManual(current.calories, current.caloriesSource, incomingText(day.calories, 0), day.caloriesSource);
    const next: CheckIn = {
      ...current,
      weight: weight.value,
      steps: steps.value,
      calories: calories.value,
      weightSource: weight.source,
      stepsSource: steps.source,
      caloriesSource: calories.source,
      fatPct: keepDeviceMetric(current.fatPct, incomingText(day.fatPct, 1)),
      muscleLb: keepDeviceMetric(current.muscleLb, incomingText(day.muscleLb, 1)),
      bmi: keepDeviceMetric(current.bmi, incomingText(day.bmi, 1)),
      activeMinutes: keepDeviceMetric(current.activeMinutes, incomingText(day.activeMinutes, 0)),
      restingHr: keepDeviceMetric(current.restingHr, incomingText(day.restingHr, 0)),
      sleepMinutes: keepDeviceMetric(current.sleepMinutes, incomingText(day.sleepMinutes, 0)),
      bodySource: day.bodySource ?? current.bodySource,
      activitySource: day.activitySource ?? current.activitySource,
      sleepSource: day.sleepSource ?? current.sleepSource,
    };
    const useful = [
      next.weight,
      next.steps,
      next.calories,
      next.fatPct,
      next.muscleLb,
      next.bmi,
      next.activeMinutes,
      next.restingHr,
      next.sleepMinutes,
    ].some((value) => value && value.trim() !== "");
    if (useful) byDate.set(day.date, next);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
