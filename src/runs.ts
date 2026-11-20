import type { PlanDay } from "./data.ts";
import { addDays, parseISODate, todayISO } from "./dates.ts";

export const EASY_HR_LIMIT = 145;
export const MISS_RATIO = 0.8;
export const START_MATCH_MINUTES = 20;
export const WEEKLY_START = 14;
export const WEEKLY_GOAL = 35;

export type RunKind = "run" | "walk";
export type RunSource = "manual" | "fitbit";
export type EveningKind = "easy-walk" | "hard";
export type HardStyle = "intervals" | "continuous";

export type HeartZones = {
  out?: number;
  fatBurn?: number;
  cardio?: number;
  peak?: number;
};

export type RunLog = {
  id: string;
  date: string;
  start: string;
  distanceMi: number;
  durationMin: number;
  kind: RunKind;
  source: RunSource;
  avgHr?: number;
  calories?: number;
  steps?: number;
  elevationFt?: number;
  zones?: HeartZones;
};

export type SyncedActivity = Omit<RunLog, "source">;

export type LadderWeek = {
  week: number;
  weeklyMiles: number;
  recovery: boolean;
  sessionMiles: number;
  hardRunMiles: number;
  hardStyle: HardStyle;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatMiles(value: number): string {
  return round1(value).toFixed(1);
}

export function mondayOf(iso: string): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return todayISO(date);
}

export function buildLadder(): LadderWeek[] {
  const weeks: LadderWeek[] = [];
  let peak = WEEKLY_START;
  for (let week = 1; week <= 24; week += 1) {
    const recovery = week % 4 === 0;
    let weekly = peak;
    if (week === 1) weekly = WEEKLY_START;
    else if (recovery) weekly = round1(peak * 0.8);
    else {
      peak = round1(Math.min(WEEKLY_GOAL, peak * 1.1));
      weekly = peak;
    }
    const session = round1(Math.min(5, weekly / 7));
    const peakSession = Math.min(5, peak / 7);
    const span = Math.max(0, Math.min(1, (peakSession - 2) / 3));
    const hardRun = round1(Math.min(3, session, 0.5 + span * 2.5));
    weeks.push({
      week,
      weeklyMiles: weekly,
      recovery,
      sessionMiles: session,
      hardRunMiles: hardRun,
      hardStyle: hardRun >= 2 ? "continuous" : "intervals",
    });
    if (!recovery && peak >= WEEKLY_GOAL) break;
  }
  return weeks;
}

function coveredWeekdays(day: PlanDay): number[] {
  const name = day.day.toLowerCase();
  return WEEKDAYS.map((label, index) => (name.includes(label.toLowerCase()) ? index : -1)).filter((index) => index >= 0);
}

export function isLegDay(day: PlanDay): boolean {
  const blob = `${day.day} ${day.rows.map((row) => row[0]).join(" ")}`.toLowerCase();
  const legMove = /lower|squat|split|lunge|step-up|leg press|romanian|deadlift|hip thrust|leg curl/.test(blob);
  if (/\bupper\b/.test(day.day.toLowerCase()) && !legMove) return false;
  return legMove;
}

function isUpperDay(day: PlanDay): boolean {
  return /\bupper\b/.test(day.day.toLowerCase()) && !isLegDay(day);
}

export type EveningPlan = {
  kind: EveningKind;
  todayLeg: boolean;
  tomorrowLeg: boolean;
  note: string;
};

export function eveningPlans(plan: PlanDay[]): EveningPlan[] {
  const owner = new Map<number, PlanDay>();
  for (const day of plan) {
    for (const index of coveredWeekdays(day)) {
      if (!owner.has(index)) owner.set(index, day);
    }
  }
  const leg = WEEKDAYS.map((_, index) => {
    const day = owner.get(index);
    return day ? isLegDay(day) : false;
  });
  const upper = WEEKDAYS.map((_, index) => {
    const day = owner.get(index);
    return day ? isUpperDay(day) : false;
  });
  const legal = WEEKDAYS.map((_, index) => !leg[index] && !leg[(index + 1) % 7]);
  const order = [1, 2, 3, 4, 5, 6, 0];
  const chosen = new Set<number>();
  for (const index of order) {
    if (legal[index] && upper[index] && chosen.size < 3) chosen.add(index);
  }
  for (const index of order) {
    if (legal[index] && chosen.size < 3) chosen.add(index);
  }
  return WEEKDAYS.map((_, index) => {
    const todayLeg = leg[index];
    const tomorrowLeg = leg[(index + 1) % 7];
    const notes: string[] = [];
    if (tomorrowLeg) notes.push("Easy walk tonight to keep legs fresh for leg day");
    if (todayLeg) notes.push("Easy walk tonight; legs recovering.");
    return {
      kind: chosen.has(index) ? "hard" : "easy-walk",
      todayLeg,
      tomorrowLeg,
      note: notes.join(" "),
    };
  });
}

export function eveningForDate(plan: PlanDay[], iso: string): EveningPlan {
  return eveningPlans(plan)[parseISODate(iso).getDay()];
}

export function weekdayLabel(index: number): string {
  return WEEKDAYS[index] ?? "";
}

export type WeekAttempt = {
  weekStart: string;
  miles: number;
  target: number;
  ladderWeek: number;
  met: boolean;
};

export function milesByWeek(runs: RunLog[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const run of runs) {
    const key = mondayOf(run.date);
    totals.set(key, (totals.get(key) ?? 0) + run.distanceMi);
  }
  return totals;
}

export function roadStatus(runs: RunLog[], today = todayISO()) {
  const ladder = buildLadder();
  const totals = milesByWeek(runs);
  const currentWeek = mondayOf(today);
  const loggedThisWeek = totals.get(currentWeek) ?? 0;
  if (runs.length === 0) {
    return { ladder, index: 0, repeating: false, attempts: [] as WeekAttempt[], loggedThisWeek, step: ladder[0], currentWeek };
  }
  const first = mondayOf([...runs].sort((a, b) => a.date.localeCompare(b.date))[0].date);
  const attempts: WeekAttempt[] = [];
  let index = 0;
  for (let cursor = first; cursor < currentWeek; cursor = addDays(cursor, 7)) {
    const target = ladder[index].weeklyMiles;
    const miles = totals.get(cursor) ?? 0;
    const met = miles >= target * MISS_RATIO;
    attempts.push({ weekStart: cursor, miles, target, ladderWeek: index + 1, met });
    if (met && index < ladder.length - 1) index += 1;
  }
  const previous = attempts.at(-1);
  return {
    ladder,
    index,
    repeating: Boolean(previous && !previous.met),
    attempts,
    loggedThisWeek,
    step: ladder[index],
    currentWeek,
  };
}

export function paceSeconds(run: Pick<RunLog, "distanceMi" | "durationMin">): number | null {
  if (run.distanceMi <= 0 || run.durationMin <= 0) return null;
  return (run.durationMin * 60) / run.distanceMi;
}

export function formatPace(seconds: number): string {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remain = rounded % 60;
  return `${minutes}:${String(remain).padStart(2, "0")} / mi`;
}

export function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const remain = total % 60;
  if (hours <= 0) return `${remain} min`;
  return `${hours} h ${remain} min`;
}

export function easyHrHigh(run: Pick<RunLog, "avgHr" | "kind">, evening: EveningKind): boolean {
  if (run.avgHr === undefined || run.avgHr <= EASY_HR_LIMIT) return false;
  return evening !== "hard" || run.kind === "walk";
}

export type PaceBucket = { id: string; label: string; min: number; max: number };

export const PACE_BUCKETS: PaceBucket[] = [
  { id: "fast", label: "Faster than 9:00 / mi", min: 0, max: 9 * 60 },
  { id: "steady", label: "9:00–10:30 / mi", min: 9 * 60, max: 10.5 * 60 },
  { id: "easy", label: "10:30–12:00 / mi", min: 10.5 * 60, max: 12 * 60 },
  { id: "jog", label: "12:00–14:00 / mi", min: 12 * 60, max: 14 * 60 },
  { id: "walk", label: "Slower than 14:00 / mi", min: 14 * 60, max: Number.POSITIVE_INFINITY },
];

export function paceBucket(seconds: number): PaceBucket {
  return PACE_BUCKETS.find((bucket) => seconds >= bucket.min && seconds < bucket.max) ?? PACE_BUCKETS[PACE_BUCKETS.length - 1];
}

export type FitnessPoint = { weekStart: string; hr: number; count: number };

export function fitnessTrend(runs: RunLog[]): { bucket: PaceBucket; points: FitnessPoint[] } | null {
  const grouped = new Map<string, RunLog[]>();
  for (const run of runs) {
    if (run.avgHr === undefined) continue;
    const pace = paceSeconds(run);
    if (pace === null) continue;
    const bucket = paceBucket(pace);
    const list = grouped.get(bucket.id) ?? [];
    list.push(run);
    grouped.set(bucket.id, list);
  }
  let best: PaceBucket | null = null;
  let bestCount = 0;
  for (const bucket of PACE_BUCKETS) {
    const count = grouped.get(bucket.id)?.length ?? 0;
    if (count > bestCount) {
      best = bucket;
      bestCount = count;
    }
  }
  if (!best || bestCount === 0) return null;
  const byWeek = new Map<string, number[]>();
  for (const run of grouped.get(best.id) ?? []) {
    const key = mondayOf(run.date);
    const list = byWeek.get(key) ?? [];
    if (run.avgHr !== undefined) list.push(run.avgHr);
    byWeek.set(key, list);
  }
  const points = [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, hrs]) => ({
      weekStart,
      hr: hrs.reduce((sum, value) => sum + value, 0) / hrs.length,
      count: hrs.length,
    }));
  return { bucket: best, points };
}

export function fitnessNote(points: FitnessPoint[]): string {
  const base = "A falling line means fitness is improving: the same pace takes less heart rate.";
  if (points.length < 2) return base;
  const delta = points[points.length - 1].hr - points[0].hr;
  if (delta <= -2) return `${base} Heart rate at this pace is down, which usually means aerobic fitness is improving.`;
  if (delta >= 2) return `${base} Heart rate at this pace is up. Heat, sleep, and a harder effort can do that.`;
  return `${base} Heart rate at this pace is holding steady.`;
}

export function weeklySeries(runs: RunLog[], today = todayISO()) {
  const status = roadStatus(runs, today);
  const totals = milesByWeek(runs);
  const rows: { weekStart: string; miles: number; target: number; pace: number | null; hr: number | null }[] = [];
  const start = status.attempts[0]?.weekStart ?? status.currentWeek;
  for (let cursor = start; cursor <= status.currentWeek; cursor = addDays(cursor, 7)) {
    const attempt = status.attempts.find((item) => item.weekStart === cursor);
    const target = attempt?.target ?? status.step.weeklyMiles;
    const inWeek = runs.filter((run) => mondayOf(run.date) === cursor);
    const paces = inWeek.map(paceSeconds).filter((value): value is number => value !== null);
    const hrs = inWeek.map((run) => run.avgHr).filter((value): value is number => value !== undefined);
    rows.push({
      weekStart: cursor,
      miles: totals.get(cursor) ?? 0,
      target,
      pace: paces.length ? paces.reduce((sum, value) => sum + value, 0) / paces.length : null,
      hr: hrs.length ? hrs.reduce((sum, value) => sum + value, 0) / hrs.length : null,
    });
  }
  return rows.slice(-8);
}

function clockMinutes(start: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(start.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function sameSession(left: Pick<RunLog, "date" | "start" | "distanceMi">, right: Pick<RunLog, "date" | "start" | "distanceMi">): boolean {
  if (left.date !== right.date) return false;
  const a = clockMinutes(left.start);
  const b = clockMinutes(right.start);
  if (a !== null && b !== null) {
    const diff = Math.abs(a - b);
    return Math.min(diff, 1440 - diff) <= START_MATCH_MINUTES;
  }
  return Math.abs(left.distanceMi - right.distanceMi) <= 0.2;
}

export function mergeRuns(current: RunLog[], incoming: SyncedActivity[], windowStart: string): RunLog[] {
  const manual = current.filter((run) => run.source === "manual");
  const synced = incoming.map((activity) => ({ ...activity, source: "fitbit" as const }));
  const incomingIds = new Set(synced.map((run) => run.id));
  const kept = current.filter((run) => {
    if (run.source !== "fitbit") return false;
    if (incomingIds.has(run.id)) return false;
    return run.date < windowStart;
  });
  const fitbit = [...kept, ...synced].filter((run) => !manual.some((item) => sameSession(item, run)));
  const byId = new Map<string, RunLog>();
  for (const run of [...manual, ...fitbit]) byId.set(run.id, run);
  return [...byId.values()].sort((a, b) => (a.date === b.date ? b.start.localeCompare(a.start) : b.date.localeCompare(a.date)));
}

function finiteNumber(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(number) || number < 0) return undefined;
  return number;
}

function zonesFrom(value: unknown): HeartZones | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Partial<HeartZones>;
  const zones: HeartZones = {
    out: finiteNumber(row.out),
    fatBurn: finiteNumber(row.fatBurn),
    cardio: finiteNumber(row.cardio),
    peak: finiteNumber(row.peak),
  };
  if (zones.out === undefined && zones.fatBurn === undefined && zones.cardio === undefined && zones.peak === undefined) return undefined;
  return zones;
}

export function normalizeRun(value: unknown): RunLog | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<RunLog>;
  if (typeof row.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return null;
  if (row.kind !== "run" && row.kind !== "walk") return null;
  if (row.source !== "manual" && row.source !== "fitbit") return null;
  const distance = finiteNumber(row.distanceMi);
  const duration = finiteNumber(row.durationMin);
  if (distance === undefined || distance <= 0 || duration === undefined || duration <= 0) return null;
  const id = typeof row.id === "string" && row.id.trim() ? row.id.slice(0, 80) : "";
  if (!id) return null;
  const start = typeof row.start === "string" ? row.start.slice(0, 5) : "";
  return {
    id,
    date: row.date,
    start: /^\d{2}:\d{2}$/.test(start) ? start : "",
    distanceMi: Math.round(distance * 100) / 100,
    durationMin: Math.round(duration * 10) / 10,
    kind: row.kind,
    source: row.source,
    avgHr: finiteNumber(row.avgHr),
    calories: finiteNumber(row.calories),
    steps: finiteNumber(row.steps),
    elevationFt: finiteNumber(row.elevationFt),
    zones: zonesFrom(row.zones),
  };
}

export function eveningCopy(plan: PlanDay[], day: PlanDay, runs: RunLog[], today = todayISO()) {
  const status = roadStatus(runs, today);
  const schedule = eveningPlans(plan);
  const indexes = coveredWeekdays(day);
  const nights = (indexes.length ? indexes : [parseISODate(today).getDay()]).map((index) => ({
    label: WEEKDAYS[index],
    ...schedule[index],
  }));
  const kinds = new Set(nights.map((night) => night.kind));
  const name = kinds.size === 1 && nights[0].kind === "hard" ? "Evening run · Hard" : kinds.size === 1 ? "Evening walk · Easy" : "Evening walk or run";
  const lines = nights.map((night) => {
    if (night.kind === "hard") {
      const style = status.step.hardStyle === "intervals" ? "run/walk intervals" : "continuous jog";
      return `${night.label}: Hard run, ${formatMiles(status.step.sessionMiles)} mi with ${formatMiles(status.step.hardRunMiles)} mi ${style}`;
    }
    return `${night.label}: Easy walk, ${formatMiles(status.step.sessionMiles)} mi, no running`;
  });
  const notes = nights.map((night) => night.note).filter(Boolean);
  const hr = nights.some((night) => night.kind !== "hard") ? `Keep avg HR under ~${EASY_HR_LIMIT} bpm.` : "";
  const repeat = status.repeating ? "Last week was well short of the target, so this week repeats." : "";
  const cue = [
    `This week is ${formatMiles(status.step.weeklyMiles)} mi total${status.step.recovery ? " (a lighter recovery week)" : ""}.`,
    hr,
    "Raise weekly distance by about 10% at most. If sleep gets worse after a hard run, make the next one a walk.",
    repeat,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    name,
    prescription: [...notes, ...lines, hr].filter(Boolean).join(" · "),
    cue,
    videoUrl: "",
    videoSite: "",
    forearm: false,
  };
}

export function todayRunSummary(plan: PlanDay[], runs: RunLog[], today = todayISO()) {
  const status = roadStatus(runs, today);
  const evening = eveningForDate(plan, today);
  const distance =
    evening.kind === "hard"
      ? `${formatMiles(status.step.sessionMiles)} mi hard run (${formatMiles(status.step.hardRunMiles)} mi ${status.step.hardStyle === "intervals" ? "intervals" : "continuous"})`
      : `${formatMiles(status.step.sessionMiles)} mi easy walk`;
  return {
    title: `Week ${status.step.week} · ${formatMiles(status.loggedThisWeek)} of ${formatMiles(status.step.weeklyMiles)} mi`,
    detail: `${evening.kind === "hard" ? "Hard run" : "Easy walk"} tonight · ${distance}`,
    note: [evening.note, status.repeating ? "Repeating this ladder week." : ""].filter(Boolean).join(" "),
    hr: evening.kind === "easy-walk" ? `Keep average heart rate under about ${EASY_HR_LIMIT} bpm.` : "",
  };
}
