import { diffDays, parseISODate, todayISO } from "./dates.ts";
import type { CheckIn } from "./storage.ts";

export type WeighPoint = { date: string; lb: number };

export function weighPoints(checkins: CheckIn[]): WeighPoint[] {
  return checkins
    .map((item) => ({ date: item.date, lb: Number(item.weight) }))
    .filter((point) => Number.isFinite(point.lb) && point.lb > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function rollingAverages(points: WeighPoint[]): WeighPoint[] {
  return points.map((point) => {
    const window = points.filter((other) => {
      const ago = diffDays(other.date, point.date);
      return ago >= 0 && ago <= 6;
    });
    const average = window.reduce((sum, item) => sum + item.lb, 0) / window.length;
    return { date: point.date, lb: average };
  });
}

export function weekStart(iso: string): string {
  const date = parseISODate(iso);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return todayISO(date);
}

export type WeekAverage = { weekStart: string; average: number; count: number };

export function weeklyAverages(points: WeighPoint[]): WeekAverage[] {
  const buckets = new Map<string, number[]>();
  for (const point of points) {
    const key = weekStart(point.date);
    const list = buckets.get(key) ?? [];
    list.push(point.lb);
    buckets.set(key, list);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([start, values]) => ({
      weekStart: start,
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      count: values.length,
    }));
}

export type WeekFlag = "fast" | "up" | null;

export function describeWeek(weeks: WeekAverage[]): {
  current: WeekAverage | null;
  previous: WeekAverage | null;
  change: number | null;
  flag: WeekFlag;
} {
  const current = weeks.at(-1) ?? null;
  const previous = weeks.length >= 2 ? weeks[weeks.length - 2] : null;
  if (!current || !previous) return { current, previous, change: null, flag: null };
  const change = current.average - previous.average;
  let flag: WeekFlag = null;
  if (change < -1.5) flag = "fast";
  else if (weeks.length >= 3) {
    const before = weeks[weeks.length - 3];
    const previousChange = previous.average - before.average;
    if (change > 0 && previousChange > 0) flag = "up";
  }
  return { current, previous, change, flag };
}

export const FAST_LOSS_NOTE = "Losing faster than planned; consider eating a bit more.";
export const TWO_WEEK_RISE_NOTE = "The weekly average is up two weeks in a row. A bounce can be normal. This is a check, not a verdict.";

export type AbsPhase = 0 | 1 | 2;

export function absRoadmap(checkins: CheckIn[], planStart: string, today = todayISO()): {
  current: number;
  percent: number;
  phase: AbsPhase;
} {
  const latest = weighPoints(checkins).at(-1);
  const current = latest?.lb ?? 195;
  const lost = Math.max(0, 195 - current);
  const percent = Math.max(0, Math.min(1, lost / (195 - 177)));
  const months = Math.max(0, diffDays(planStart, today) / 30.44);
  const phase: AbsPhase = months >= 6 ? 2 : months >= 3 ? 1 : 0;
  return { current, percent, phase };
}
