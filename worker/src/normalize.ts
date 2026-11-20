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

type Civil = { date?: { year?: number; month?: number; day?: number }; time?: { hours?: number; minutes?: number } };

function isoFromCivil(value: Civil | undefined): string {
  const date = value?.date;
  if (!date?.year || !date.month || !date.day) return "";
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function clockFromCivil(value: Civil | undefined): string {
  const hours = value?.time?.hours ?? 0;
  const minutes = value?.time?.minutes ?? 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function firstNumber(record: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function durationMinutes(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const seconds = Number(value.replace(/s$/, ""));
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.round((seconds / 60) * 10) / 10;
}

export function parseHealthStepsRollup(points: { civilStartTime?: Civil; steps?: Record<string, unknown> }[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const point of points ?? []) {
    const date = isoFromCivil(point.civilStartTime);
    const count = firstNumber(point.steps, ["countSum", "count_sum"]);
    if (date && count !== undefined) days.set(date, count);
  }
  return days;
}

export function parseHealthCalorieRollup(points: { civilStartTime?: Civil; totalCalories?: Record<string, unknown> }[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const point of points ?? []) {
    const date = isoFromCivil(point.civilStartTime);
    const kcal = firstNumber(point.totalCalories, ["kcalSum", "kcal_sum"]);
    if (date && kcal !== undefined) days.set(date, Math.round(kcal));
  }
  return days;
}

export function parseHealthActiveMinutes(points: { activeMinutes?: { interval?: { civilStartTime?: Civil }; activeMinutesByActivityLevel?: { activityLevel?: string; activeMinutes?: string }[] } }[] | undefined): { fairly: Map<string, number>; very: Map<string, number> } {
  const fairly = new Map<string, number>();
  const very = new Map<string, number>();
  for (const point of points ?? []) {
    const date = isoFromCivil(point.activeMinutes?.interval?.civilStartTime);
    if (!date) continue;
    for (const row of point.activeMinutes?.activeMinutesByActivityLevel ?? []) {
      const minutes = Number(row.activeMinutes);
      if (!Number.isFinite(minutes)) continue;
      const bucket = row.activityLevel === "VIGOROUS" ? very : row.activityLevel === "MODERATE" ? fairly : null;
      if (!bucket) continue;
      bucket.set(date, (bucket.get(date) ?? 0) + minutes);
    }
  }
  return { fairly, very };
}

export function parseHealthRestingHeart(points: { dailyRestingHeartRate?: { date?: Civil["date"]; beatsPerMinute?: string } }[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const point of points ?? []) {
    const date = isoFromCivil({ date: point.dailyRestingHeartRate?.date });
    const bpm = Number(point.dailyRestingHeartRate?.beatsPerMinute);
    if (date && Number.isFinite(bpm) && bpm > 0) days.set(date, bpm);
  }
  return days;
}

export function parseHealthSleep(points: { sleep?: { interval?: { civilStartTime?: Civil }; summary?: { minutesAsleep?: string | number } } }[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const point of points ?? []) {
    const date = isoFromCivil(point.sleep?.interval?.civilStartTime);
    const minutes = Number(point.sleep?.summary?.minutesAsleep);
    if (!date || !Number.isFinite(minutes) || minutes <= 0) continue;
    days.set(date, (days.get(date) ?? 0) + minutes);
  }
  return days;
}

const GRAMS_PER_LB = 453.59237;

export function parseHealthWeight(points: { weight?: { sampleTime?: { civilTime?: Civil }; weightGrams?: number } }[] | undefined): Map<string, number> {
  const days = new Map<string, number>();
  for (const point of points ?? []) {
    const date = isoFromCivil(point.weight?.sampleTime?.civilTime);
    const grams = point.weight?.weightGrams;
    if (!date || !Number.isFinite(grams) || !grams || grams <= 0) continue;
    days.set(date, Math.round((grams / GRAMS_PER_LB) * 10) / 10);
  }
  return days;
}

export function parseHealthExercises(points: { name?: string; exercise?: Record<string, unknown> }[] | undefined): FitbitActivity[] {
  const activities: FitbitActivity[] = [];
  for (const point of points ?? []) {
    const exercise = point.exercise;
    if (!exercise) continue;
    const kind = activityKind(String(exercise.exerciseType ?? ""));
    const interval = exercise.interval as { startTime?: string; civilStartTime?: Civil; endTime?: string } | undefined;
    const metrics = exercise.metricsSummary as Record<string, unknown> | undefined;
    const date = isoFromCivil(interval?.civilStartTime) || String(interval?.startTime ?? "").slice(0, 10);
    const distanceMm = Number(metrics?.distanceMillimeters);
    const duration = durationMinutes(exercise.activeDuration) ?? durationBetween(interval?.startTime, interval?.endTime);
    if (!kind || !date || !Number.isFinite(distanceMm) || distanceMm <= 0 || duration === undefined) continue;
    const zones = metrics?.heartRateZoneDurations as Record<string, unknown> | undefined;
    const light = durationMinutes(zones?.lightTime);
    const moderate = durationMinutes(zones?.moderateTime);
    const vigorous = durationMinutes(zones?.vigorousTime);
    const peak = durationMinutes(zones?.peakTime);
    const hr = Number(metrics?.averageHeartRateBeatsPerMinute);
    const calories = Number(metrics?.caloriesKcal);
    const steps = Number(metrics?.steps);
    const elevationMm = Number(metrics?.elevationGainMillimeters);
    activities.push({
      id: `google:${String(point.name ?? interval?.startTime ?? date)}`,
      date,
      start: clockFromCivil(interval?.civilStartTime),
      distanceMi: Math.round((distanceMm / 1_609_344) * 100) / 100,
      durationMin: duration,
      kind,
      avgHr: Number.isFinite(hr) && hr > 0 ? hr : undefined,
      calories: Number.isFinite(calories) && calories > 0 ? calories : undefined,
      steps: Number.isFinite(steps) && steps > 0 ? steps : undefined,
      elevationFt: Number.isFinite(elevationMm) && elevationMm > 0 ? Math.round(elevationMm / 304.8) : undefined,
      zones: light || moderate || vigorous || peak ? { fatBurn: light, cardio: moderate, peak: (vigorous ?? 0) + (peak ?? 0) || undefined } : undefined,
    });
  }
  return activities;
}

function durationBetween(start: string | undefined, end: string | undefined): number | undefined {
  if (!start || !end) return undefined;
  const ms = Date.parse(end) - Date.parse(start);
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  return Math.round((ms / 60000) * 10) / 10;
}
