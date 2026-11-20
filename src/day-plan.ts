import { LIB, STRETCHES, matchExercise, type PlanDay } from "./data.ts";

export const FOREARM_PLATE_NOTE = "Use a neutral grip; stop if you feel pain at the plate.";

export type DayMove = {
  name: string;
  prescription: string;
  cue: string;
  videoUrl: string;
  videoSite: string;
  forearm: boolean;
};

export type DayOutline = {
  warmup: DayMove[];
  workout: DayMove[];
  cooldown: DayMove[];
  snacks: DayMove[];
};

const INCLINE_PUSHUP = LIB.find((exercise) => exercise.name === "Incline push-up on dumbbell handles");
const GOBLET = LIB.find((exercise) => exercise.name === "Goblet squat");

export function loadsForearm(name: string): boolean {
  const n = name.toLowerCase();
  if (
    /bike|walk|dead bug|leg press|leg curl|hip hinge|bodyweight squat|arm circle|hamstring stretch|hip flexor|figure-4|calf stretch|child's pose|cat-cow/.test(
      n,
    )
  ) {
    return false;
  }
  return /row|curl|press|push-up|pushup|kettlebell|carry|plank|pulldown|face pull|pallof|pushdown|fly|goblet|split squat|romanian|deadlift|step-up|thrust|dumbbell|doorway|forearm/.test(
    n,
  );
}

function stretchMove(name: string): DayMove {
  const stretch = STRETCHES.find((item) => item.name === name);
  if (!stretch) throw new Error(`Missing stretch ${name}`);
  return {
    name: stretch.name,
    prescription: stretch.hold,
    cue: stretch.cue,
    videoUrl: stretch.videoUrl,
    videoSite: stretch.videoSite,
    forearm: loadsForearm(stretch.name),
  };
}

function isStretchRow(name: string): boolean {
  return /stretch routine/.test(name.toLowerCase());
}

export function workoutRows(day: PlanDay): [string, string][] {
  return day.rows.filter(([name]) => !isStretchRow(name));
}

function moveFromPlan(name: string, prescription: string): DayMove {
  const exercise = matchExercise(name);
  return {
    name,
    prescription,
    cue: exercise?.cue ?? "Follow the plan as written, and keep the left side comfortable.",
    videoUrl: exercise?.videoUrl ?? "",
    videoSite: exercise?.videoSite ?? "",
    forearm: loadsForearm(name),
  };
}

function cooldownFor(rows: [string, string][]): DayMove[] {
  const blob = rows.map(([name]) => name).join(" ").toLowerCase();
  const chosen: string[] = [];
  const take = (name: string) => {
    if (chosen.length >= 3 || chosen.includes(name)) return;
    chosen.push(name);
  };
  const legs = /squat|split|lunge|step-up|leg press|thrust|bike|walk/.test(blob);
  const hinge = /romanian|deadlift|leg curl|hinge/.test(blob);
  const push = /bench press|dumbbell press|shoulder press|push-up|pushup|chest press|rear-delt|fly|pushdown/.test(blob);
  const pull = /row|pulldown|face pull|hammer curl/.test(blob);
  const core = /dead bug|plank|carry|pallof/.test(blob);
  if (hinge) take("Hamstring stretch on the bench");
  if (legs) take("Kneeling hip flexor stretch");
  if (push) take("Doorway chest stretch");
  if (pull) take("Gentle forearm flexor and extensor stretch");
  if (legs) take("Figure-4 glute stretch");
  if (core) take("Cat-cow");
  if (legs || /bike|walk/.test(blob)) take("Calf stretch on a wall");
  if (chosen.length < 2) take("Child's pose with reach");
  if (chosen.length === 0) {
    take("Kneeling hip flexor stretch");
    take("Hamstring stretch on the bench");
    take("Calf stretch on a wall");
  }
  return chosen.map(stretchMove);
}

const WARMUP: DayMove[] = [
  {
    name: "Arm circles",
    prescription: "10 each direction",
    cue: "Stand tall and make small circles forward, then back. Keep them gentle if the left wrist complains.",
    videoUrl: "",
    videoSite: "",
    forearm: false,
  },
  {
    name: "Hip hinge with hands on hips",
    prescription: "10 reps",
    cue: "Soft knees, push the hips back, and keep the back flat. This is the pattern for the deadlift, without weight.",
    videoUrl: "",
    videoSite: "",
    forearm: false,
  },
  {
    name: "Bodyweight squats",
    prescription: "10 slow reps",
    cue: "Sit down between your heels, chest up, then stand tall. No weight yet.",
    videoUrl: GOBLET?.videoUrl ?? "",
    videoSite: GOBLET?.videoSite ?? "",
    forearm: false,
  },
];

function snacks(): DayMove[] {
  return [
    {
      name: "Mid-morning · Incline push-up on dumbbell handles",
      prescription: "1 set, about half of a max set",
      cue: "Hands on dumbbells resting on the bench so the wrist stays neutral. Stop around half of what you could do in one all-out set.",
      videoUrl: INCLINE_PUSHUP?.videoUrl ?? "",
      videoSite: INCLINE_PUSHUP?.videoSite ?? "",
      forearm: true,
    },
    {
      name: "After lunch · Bodyweight squats",
      prescription: "10–15 reps, about half of a max set",
      cue: "Easy pace after lunch. Same squat pattern as the goblet squat, with no dumbbell.",
      videoUrl: GOBLET?.videoUrl ?? "",
      videoSite: GOBLET?.videoSite ?? "",
      forearm: false,
    },
    {
      name: "Evening · Easy walk",
      prescription: "Distance for this week is on the Running tab",
      cue: "Easy walk the night before a leg day and the evening of a leg day. Hard runs sit on other evenings. Keep an easy night's average heart rate under about 145 bpm. Raise weekly distance by about 10% at most, and walk if sleep gets worse after a hard run.",
      videoUrl: "",
      videoSite: "",
      forearm: false,
    },
  ];
}

export type LibraryGroup = "All" | "Warm-up" | "Strength" | "Stretches" | "Movement breaks";

export type LibraryEntry = DayMove & { group: Exclude<LibraryGroup, "All"> };

export const LIBRARY_GROUPS: LibraryGroup[] = ["All", "Warm-up", "Strength", "Stretches", "Movement breaks"];

export function libraryEntries(): LibraryEntry[] {
  const strength: LibraryEntry[] = LIB.map((exercise) => ({
    name: exercise.name,
    prescription: exercise.muscles,
    cue: exercise.cue,
    videoUrl: exercise.videoUrl,
    videoSite: exercise.videoSite,
    forearm: loadsForearm(exercise.name),
    group: "Strength",
  }));
  const stretches: LibraryEntry[] = STRETCHES.map((stretch) => ({
    name: stretch.name,
    prescription: stretch.hold,
    cue: stretch.cue,
    videoUrl: stretch.videoUrl,
    videoSite: stretch.videoSite,
    forearm: loadsForearm(stretch.name),
    group: "Stretches",
  }));
  return [
    ...WARMUP.map((move) => ({ ...move, group: "Warm-up" as const })),
    ...strength,
    ...stretches,
    ...snacks().map((move) => ({ ...move, group: "Movement breaks" as const })),
  ];
}

export function filterLibrary(entries: LibraryEntry[], group: LibraryGroup, query: string): LibraryEntry[] {
  const needle = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (group !== "All" && entry.group !== group) return false;
    if (!needle) return true;
    return `${entry.name} ${entry.cue} ${entry.prescription}`.toLowerCase().includes(needle);
  });
}

export function dayOutline(day: PlanDay): DayOutline {
  const rows = workoutRows(day);
  return {
    warmup: WARMUP,
    workout: rows.map(([name, prescription]) => moveFromPlan(name, prescription)),
    cooldown: cooldownFor(day.rows),
    snacks: snacks(),
  };
}
