import { todayISO } from "./dates.ts";

export type Phase = "home" | "gym";
export type PlanDays = "3" | "4" | "5";
export type ThemeChoice = "light" | "dark" | "system";
export type Sex = "male" | "female";
export type Activity = "desk" | "mixed" | "feet";

export type Profile = {
  weight: string;
  height: string;
  age: string;
  sex: Sex;
  activity: Activity;
  theme: ThemeChoice;
  planStart: string;
  phase: Phase;
  days: PlanDays;
  dismissedInstall: boolean;
};

export type SetLog = { weight: string; reps: string };

export type ExerciseLog = {
  name: string;
  prescription: string;
  sets: SetLog[];
};

export type WorkoutLog = {
  id: string;
  date: string;
  label: string;
  phase: Phase;
  days: PlanDays;
  exercises: ExerciseLog[];
  updatedAt: string;
};

export type CheckIn = {
  date: string;
  weight: string;
  steps: string;
  calories: string;
};

export type Data = {
  profile: Profile;
  checkins: CheckIn[];
  workouts: WorkoutLog[];
};

export const STORAGE_KEY = "fitness-data-v1";

export function defaultProfile(today = todayISO()): Profile {
  return {
    weight: "195",
    height: "71",
    age: "36",
    sex: "male",
    activity: "desk",
    theme: "system",
    planStart: today,
    phase: "home",
    days: "5",
    dismissedInstall: false,
  };
}

export function defaultData(): Data {
  return { profile: defaultProfile(), checkins: [], workouts: [] };
}

function asString(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value.slice(0, 24);
  return "";
}

function asName(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 140) : "";
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeSet(value: unknown): SetLog {
  const row = value && typeof value === "object" ? (value as Partial<SetLog>) : {};
  return { weight: asString(row.weight), reps: asString(row.reps) };
}

function normalizeWorkout(value: unknown): WorkoutLog | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<WorkoutLog>;
  if (!isIsoDate(row.date) || typeof row.label !== "string") return null;
  const phase: Phase = row.phase === "gym" ? "gym" : "home";
  const days: PlanDays = row.days === "3" || row.days === "4" || row.days === "5" ? row.days : "5";
  const exercises = Array.isArray(row.exercises)
    ? row.exercises
        .map((exercise) => {
          if (!exercise || typeof exercise !== "object") return null;
          const item = exercise as Partial<ExerciseLog>;
          const name = asName(item.name);
          if (!name) return null;
          return {
            name,
            prescription: asName(item.prescription),
            sets: Array.isArray(item.sets) ? item.sets.slice(0, 12).map(normalizeSet) : [],
          };
        })
        .filter((exercise): exercise is ExerciseLog => exercise !== null)
    : [];
  const id = typeof row.id === "string" && row.id ? row.id.slice(0, 180) : `${row.date}|${phase}|${row.label}`;
  return {
    id,
    date: row.date,
    label: row.label.slice(0, 80),
    phase,
    days,
    exercises,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt.slice(0, 40) : new Date().toISOString(),
  };
}

function normalizeCheckin(value: unknown): CheckIn | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<CheckIn>;
  if (!isIsoDate(row.date)) return null;
  return {
    date: row.date,
    weight: asString(row.weight),
    steps: asString(row.steps),
    calories: asString(row.calories),
  };
}

export function normalize(raw: unknown): Data {
  const fallback = defaultData();
  if (!raw || typeof raw !== "object") return fallback;
  const row = raw as Partial<Data>;
  const incoming = row.profile && typeof row.profile === "object" ? row.profile : {};
  const profile: Profile = { ...fallback.profile, ...incoming };
  if (profile.sex !== "male" && profile.sex !== "female") profile.sex = "male";
  if (profile.activity !== "desk" && profile.activity !== "mixed" && profile.activity !== "feet") profile.activity = "desk";
  if (profile.theme !== "light" && profile.theme !== "dark" && profile.theme !== "system") profile.theme = "system";
  if (profile.phase !== "home" && profile.phase !== "gym") profile.phase = "home";
  if (profile.days !== "3" && profile.days !== "4" && profile.days !== "5") profile.days = "5";
  if (!isIsoDate(profile.planStart)) profile.planStart = fallback.profile.planStart;
  profile.weight = asString(profile.weight) || fallback.profile.weight;
  profile.height = asString(profile.height) || fallback.profile.height;
  profile.age = asString(profile.age) || fallback.profile.age;
  profile.dismissedInstall = Boolean(profile.dismissedInstall);
  const checkins = Array.isArray(row.checkins) ? row.checkins.map(normalizeCheckin).filter((item): item is CheckIn => item !== null) : [];
  const workouts = Array.isArray(row.workouts) ? row.workouts.map(normalizeWorkout).filter((item): item is WorkoutLog => item !== null) : [];
  const seen = new Set<string>();
  const uniqueCheckins = checkins.filter((item) => {
    if (seen.has(item.date)) return false;
    seen.add(item.date);
    return true;
  });
  return { profile, checkins: uniqueCheckins, workouts };
}

export function loadData(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultData();
  }
}

export function saveData(data: Data): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return null;
  } catch {
    return "This phone blocked saving. Free a little space, then try again.";
  }
}

export function parseBackup(raw: unknown): Data {
  if (!raw || typeof raw !== "object") throw new Error("That file is not a fitness backup.");
  const row = raw as Record<string, unknown>;
  if (!("profile" in row) && !("checkins" in row) && !("workouts" in row)) {
    throw new Error("That file is not a fitness backup.");
  }
  return normalize(raw);
}

export function backupPayload(data: Data): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: data.profile,
      checkins: data.checkins,
      workouts: data.workouts,
    },
    null,
    2,
  );
}
