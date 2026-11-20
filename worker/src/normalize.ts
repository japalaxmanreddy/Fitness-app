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

const LB_PER_KG = 2.2046;

export function withingsValue(value: number, unit: number): number {
  return value * 10 ** unit;
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

type Measure = { value: number; type: number; unit: number };
type MeasureGroup = { date: number; measures?: Measure[] };

export function parseWithingsMeasures(body: { measuregrps?: MeasureGroup[] } | undefined): Map<string, { weightKg?: number; fatPct?: number; muscleKg?: number; heightM?: number }> {
  const days = new Map<string, { at: number; weightKg?: number; fatPct?: number; muscleKg?: number; heightM?: number }>();
  for (const group of body?.measuregrps ?? []) {
    if (!Number.isFinite(group.date)) continue;
    const date = new Date(group.date * 1000).toISOString().slice(0, 10);
    const slot = days.get(date) ?? { at: 0 };
    if (group.date < slot.at) continue;
    const next = { ...slot, at: group.date };
    for (const measure of group.measures ?? []) {
      const real = withingsValue(measure.value, measure.unit);
      if (measure.type === 1) next.weightKg = real;
      if (measure.type === 6) next.fatPct = real;
      if (measure.type === 76) next.muscleKg = real;
      if (measure.type === 4) next.heightM = real;
    }
    days.set(date, next);
  }
  const result = new Map<string, { weightKg?: number; fatPct?: number; muscleKg?: number; heightM?: number }>();
  for (const [date, slot] of days) {
    result.set(date, { weightKg: slot.weightKg, fatPct: slot.fatPct, muscleKg: slot.muscleKg, heightM: slot.heightM });
  }
  return result;
}

export function parseWithingsActivity(body: { activities?: { date?: string; steps?: number; calories?: number; totalcalories?: number }[] } | undefined): Map<string, { steps?: number; calories?: number }> {
  const days = new Map<string, { steps?: number; calories?: number }>();
  for (const row of body?.activities ?? []) {
    if (!row.date) continue;
    days.set(row.date, { steps: numberOrUndefined(row.steps), calories: numberOrUndefined(row.totalcalories ?? row.calories) });
  }
  return days;
}

export function parseWithingsSleep(body: { series?: { date?: string; data?: { total_sleep_time?: number } }[] } | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const row of body?.series ?? []) {
    if (!row.date || !row.data?.total_sleep_time) continue;
    days.set(row.date, Math.round(row.data.total_sleep_time / 60));
  }
  return days;
}

type FitbitPoint = { dateTime?: string; value?: string };

export function parseFitbitSeries(rows: FitbitPoint[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const row of rows ?? []) {
    if (!row.dateTime) continue;
    const value = Number(row.value);
    if (Number.isFinite(value)) days.set(row.dateTime, value);
  }
  return days;
}

export function parseFitbitHeart(rows: { dateTime?: string; value?: { restingHeartRate?: number } }[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const row of rows ?? []) {
    if (!row.dateTime || !row.value?.restingHeartRate) continue;
    days.set(row.dateTime, row.value.restingHeartRate);
  }
  return days;
}

export function parseFitbitSleep(sleep: { dateOfSleep?: string; minutesAsleep?: number }[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const row of sleep ?? []) {
    if (!row.dateOfSleep || !row.minutesAsleep) continue;
    days.set(row.dateOfSleep, (days.get(row.dateOfSleep) ?? 0) + row.minutesAsleep);
  }
  return days;
}

export type FitbitActivity = {
  id: string;
  date: string;
  start: string;
  distanceMi: number;
  durationMin: number;
  kind: "run" | "walk";
  avgHr?: number;
  calories?: number;
  steps?: number;
  elevationFt?: number;
  zones?: { out?: number; fatBurn?: number; cardio?: number; peak?: number };
};

const KM_TO_MI = 0.621371;
const M_TO_FT = 3.28084;

function activityKind(name: string): "run" | "walk" | null {
  const text = name.toLowerCase();
  if (/bike|swim|yoga|weight|workout|sport/.test(text)) return null;
  if (/walk|hike/.test(text)) return "walk";
  if (/run|jog|treadmill/.test(text)) return "run";
  return null;
}

function zoneMinutes(zones: { name?: string; minutes?: number }[] | undefined, label: string): number | undefined {
  const match = zones?.find((zone) => (zone.name ?? "").toLowerCase() === label);
  return match && Number.isFinite(match.minutes) ? match.minutes : undefined;
}

export function parseFitbitActivities(body: { activities?: Record<string, unknown>[] } | undefined): FitbitActivity[] {
  const activities: FitbitActivity[] = [];
  for (const row of body?.activities ?? []) {
    const kind = activityKind(String(row.activityName ?? ""));
    const startTime = String(row.startTime ?? "");
    const distance = Number(row.distance);
    const duration = Number(row.duration);
    if (!kind || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startTime) || !Number.isFinite(distance) || distance <= 0 || !Number.isFinite(duration) || duration <= 0) {
      continue;
    }
    const unit = String(row.distanceUnit ?? "").toLowerCase();
    const miles = unit.startsWith("k") ? distance * KM_TO_MI : distance;
    const zones = Array.isArray(row.heartRateZones) ? (row.heartRateZones as { name?: string; minutes?: number }[]) : undefined;
    const hr = Number(row.averageHeartRate);
    const calories = Number(row.calories);
    const steps = Number(row.steps);
    const elevation = Number(row.elevationGain);
    const parsedZones = {
      out: zoneMinutes(zones, "out of range"),
      fatBurn: zoneMinutes(zones, "fat burn"),
      cardio: zoneMinutes(zones, "cardio"),
      peak: zoneMinutes(zones, "peak"),
    };
    const hasZone = Object.values(parsedZones).some((value) => value !== undefined);
    activities.push({
      id: `fitbit:${String(row.logId ?? startTime)}`,
      date: startTime.slice(0, 10),
      start: startTime.slice(11, 16),
      distanceMi: Math.round(miles * 100) / 100,
      durationMin: Math.round((duration / 60000) * 10) / 10,
      kind,
      avgHr: Number.isFinite(hr) && hr > 0 ? hr : undefined,
      calories: Number.isFinite(calories) && calories > 0 ? calories : undefined,
      steps: Number.isFinite(steps) && steps > 0 ? steps : undefined,
      elevationFt: Number.isFinite(elevation) && elevation > 0 ? Math.round(elevation * M_TO_FT) : undefined,
      zones: hasZone ? parsedZones : undefined,
    });
  }
  return activities;
}

export function parseFitbitWeight(rows: { date?: string; weight?: number }[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const row of rows ?? []) {
    if (!row.date || !Number.isFinite(row.weight)) continue;
    days.set(row.date, row.weight as number);
  }
  return days;
}

function numberOrUndefined(value: number | undefined): number | undefined {
  return Number.isFinite(value) ? value : undefined;
}

export function combineDays(input: {
  withingsMeasures: Map<string, { weightKg?: number; fatPct?: number; muscleKg?: number; heightM?: number }>;
  withingsActivity: Map<string, { steps?: number; calories?: number }>;
  withingsSleep: Map<string, number>;
  fitbitSteps: Map<string, number>;
  fitbitCalories: Map<string, number>;
  fitbitFairly: Map<string, number>;
  fitbitVery: Map<string, number>;
  fitbitHeart: Map<string, number>;
  fitbitSleep: Map<string, number>;
  fitbitWeight: Map<string, number>;
}): SyncedDay[] {
  const dates = new Set<string>([
    ...input.withingsMeasures.keys(),
    ...input.withingsActivity.keys(),
    ...input.withingsSleep.keys(),
    ...input.fitbitSteps.keys(),
    ...input.fitbitCalories.keys(),
    ...input.fitbitHeart.keys(),
    ...input.fitbitSleep.keys(),
    ...input.fitbitWeight.keys(),
  ]);
  const days: SyncedDay[] = [];
  for (const date of [...dates].sort()) {
    const measure = input.withingsMeasures.get(date);
    const activity = input.withingsActivity.get(date);
    const fitbitSteps = input.fitbitSteps.get(date);
    const fitbitCalories = input.fitbitCalories.get(date);
    const fairly = input.fitbitFairly.get(date) ?? 0;
    const very = input.fitbitVery.get(date) ?? 0;
    const active = fairly + very;
    const day: SyncedDay = { date };
    const weightKg = measure?.weightKg;
    const fitbitWeight = input.fitbitWeight.get(date);
    if (weightKg !== undefined) {
      day.weightLb = kgToLb(weightKg);
      day.weightSource = "withings";
      day.bodySource = "withings";
    } else if (fitbitWeight !== undefined) {
      day.weightLb = fitbitWeight;
      day.weightSource = "fitbit";
      day.bodySource = "fitbit";
    }
    if (measure?.fatPct !== undefined) {
      day.fatPct = measure.fatPct;
      day.bodySource = "withings";
    }
    if (measure?.muscleKg !== undefined) {
      day.muscleLb = kgToLb(measure.muscleKg);
      day.bodySource = "withings";
    }
    if (weightKg !== undefined && measure?.heightM && measure.heightM > 0) {
      day.bmi = weightKg / (measure.heightM * measure.heightM);
      day.bodySource = "withings";
    }
    if (fitbitSteps !== undefined) {
      day.steps = fitbitSteps;
      day.stepsSource = "fitbit";
    } else if (activity?.steps !== undefined) {
      day.steps = activity.steps;
      day.stepsSource = "withings";
    }
    if (fitbitCalories !== undefined) {
      day.calories = fitbitCalories;
      day.caloriesSource = "fitbit";
    } else if (activity?.calories !== undefined) {
      day.calories = activity.calories;
      day.caloriesSource = "withings";
    }
    if (active > 0) {
      day.activeMinutes = active;
      day.activitySource = "fitbit";
    }
    const hr = input.fitbitHeart.get(date);
    if (hr !== undefined) {
      day.restingHr = hr;
      day.activitySource = "fitbit";
    }
    const fitbitSleep = input.fitbitSleep.get(date);
    const withingsSleep = input.withingsSleep.get(date);
    if (fitbitSleep !== undefined) {
      day.sleepMinutes = fitbitSleep;
      day.sleepSource = "fitbit";
    } else if (withingsSleep !== undefined) {
      day.sleepMinutes = withingsSleep;
      day.sleepSource = "withings";
    }
    days.push(day);
  }
  return days;
}
