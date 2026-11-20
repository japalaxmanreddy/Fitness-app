import { LIB, STRETCHES, matchExercise, type PlanDay } from "./data.ts";

export const FOREARM_PLATE_NOTE = "Use a neutral grip; stop if you feel pain at the plate.";

export type DayMove = {
  name: string;
  prescription: string;
  cue: string;
  videoUrl: string;
  videoSite: string;
  forearm: boolean;
  forearmNote?: string;
};

export type DayOutline = {
  warmup: DayMove[];
  workout: DayMove[];
  abs: DayMove[];
  absNote: string;
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

export function trainingDayGetsAbs(day: PlanDay): boolean {
  const name = day.day.toLowerCase();
  if (/saturday|sunday|bike|mobility/.test(name)) return false;
  const blob = day.rows.map((row) => row[0]).join(" ").toLowerCase();
  return /squat|press|row|deadlift|thrust|curl|pulldown|plank|dead bug|pallof|lunge|step-up/.test(blob);
}

export function workoutRows(day: PlanDay): [string, string][] {
  return day.rows.filter(([name]) => {
    if (isStretchRow(name)) return false;
    if (trainingDayGetsAbs(day) && /dead bug|side plank/i.test(name)) return false;
    return true;
  });
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

type AbsStage = "base" | "reps" | "slow" | "load";

type AbsTemplate = {
  name: string;
  base: string;
  reps: string;
  slow: string;
  load: string;
  cue: string;
  videoUrl: string;
  videoSite: string;
  forearm: boolean;
  forearmNote?: string;
};

const REST = "Rest 30–45 seconds.";

const ABS_HOME: AbsTemplate[] = [
  {
    name: "Dead bug",
    base: `3 x 8 each side. ${REST}`,
    reps: `3 x 12 each side. ${REST}`,
    slow: `3 x 8 each side. Lower for 3 seconds. ${REST}`,
    load: `3 x 8 each side. Reach a little farther. No heavy load. ${REST}`,
    cue: "Low back pressed down. Extend the opposite arm and leg slowly, and keep the move small if the back lifts.",
    videoUrl: "https://www.youtube.com/watch?v=0XVbn86Btj0",
    videoSite: "Squat University",
    forearm: false,
  },
  {
    name: "Reverse crunch on the bench",
    base: `3 x 10. ${REST}`,
    reps: `3 x 14. ${REST}`,
    slow: `3 x 10. Lower the hips for 3 seconds. ${REST}`,
    load: `3 x 10. Hug a light dumbbell between the knees only if the back stays down. ${REST}`,
    cue: "Lie on the bench, knees bent, and curl the hips up a few inches. Hands rest light on the bench.",
    videoUrl: "https://www.youtube.com/watch?v=-zcoF6AFgaI",
    videoSite: "Howcast",
    forearm: true,
    forearmNote: "Rest the hands light on the bench. Do not lock them behind your head or grip hard. Stop if you feel pain at the plate.",
  },
  {
    name: "Weighted bench crunch",
    base: `3 x 8–12. Light dumbbell on the chest. ${REST}`,
    reps: `3 x 12–15. Light dumbbell on the chest. ${REST}`,
    slow: `3 x 8–12. Lower for 3 seconds, dumbbell on the chest. ${REST}`,
    load: `3 x 8–12. Add a little dumbbell weight on the chest. ${REST}`,
    cue: "Lie on the bench and curl the ribs toward the hips. The dumbbell rests on the chest. It is not a neck pull.",
    videoUrl: "https://www.youtube.com/watch?v=BiZqWXTj_d4",
    videoSite: "Fitway",
    forearm: true,
    forearmNote: "Rest the dumbbell on your chest. Don't clamp it with a bent wrist. Stop if you feel pain at the plate.",
  },
  {
    name: "Side plank on forearm",
    base: `3 x 20–30 seconds each side. ${REST}`,
    reps: `3 x 30–40 seconds each side. ${REST}`,
    slow: `3 x 20–30 seconds each side. Lower the hips for 3 seconds between holds. ${REST}`,
    load: `3 x 20 seconds each side. A light plate on the top hip only if the elbow is quiet. ${REST}`,
    cue: "Elbow under the shoulder, hips high, body in one line. Drop to the knees if the shoulder complains.",
    videoUrl: "https://www.youtube.com/watch?v=vDWfbBovDC4",
    videoSite: "Mayo Clinic",
    forearm: true,
    forearmNote: "Use a pad under the forearm, or drop to your knees. Stop if you feel pain at the plate.",
  },
  {
    name: "Russian twist with a 10 lb kettlebell",
    base: `3 x 8 each side. 10 lb kettlebell. ${REST}`,
    reps: `3 x 12 each side. 10 lb kettlebell. ${REST}`,
    slow: `3 x 8 each side. Turn slowly, about 3 seconds each way. ${REST}`,
    load: `3 x 8 each side. Stay at 10 lb unless that feels easy and the wrist is quiet. ${REST}`,
    cue: "Sit tall, heels light, and turn the ribs. Keep the kettlebell close to the chest.",
    videoUrl: "https://www.youtube.com/watch?v=IJDOoVyVjhc",
    videoSite: "Runna",
    forearm: true,
    forearmNote: "Hold the 10 lb kettlebell close, with a neutral grip. Stop if you feel pain at the plate.",
  },
  {
    name: "Lying leg raise",
    base: `3 x 8–12. ${REST}`,
    reps: `3 x 12–15. ${REST}`,
    slow: `3 x 8–12. Lower for 3 seconds. ${REST}`,
    load: `3 x 8–12. A light dumbbell between the feet only if the back stays down. ${REST}`,
    cue: "Back flat, knees softly bent. Lower only as far as the back stays down. Hands rest beside you or lightly under the hips.",
    videoUrl: "https://www.youtube.com/watch?v=l4kQd9eWclE",
    videoSite: "Howcast",
    forearm: false,
  },
  {
    name: "Bicycle crunch",
    base: `3 x 8 each side. ${REST}`,
    reps: `3 x 12 each side. ${REST}`,
    slow: `3 x 8 each side. Move for about 3 seconds each way. ${REST}`,
    load: `3 x 8 each side. Stay at body weight. Do not add a plate behind the head. ${REST}`,
    cue: "Fingertips behind the ears, elbows wide. Bring the ribs toward the opposite knee. Do not pull the neck.",
    videoUrl: "https://www.youtube.com/watch?v=1we3bh9uhqY",
    videoSite: "Tone and Tighten",
    forearm: false,
  },
  {
    name: "Hollow hold",
    base: `3 x 15–20 seconds. Knees tucked. ${REST}`,
    reps: `3 x 20–30 seconds. Knees tucked. ${REST}`,
    slow: `3 x 15–20 seconds. Reach the legs out slowly, then come back. ${REST}`,
    load: `3 x 15–20 seconds. Straighten the legs a bit more. Arms stay low. ${REST}`,
    cue: "Low back pressed down, shoulders just off the floor. Start with the knees in. Straighten the legs only while the back stays down.",
    videoUrl: "https://www.youtube.com/watch?v=LlDNef_Ztsc",
    videoSite: "GMB Fitness",
    forearm: false,
  },
];

const ABS_GYM: AbsTemplate[] = [
  {
    name: "Cable crunch",
    base: `3 x 10–15. Light cable. ${REST}`,
    reps: `3 x 12–15. Light cable. ${REST}`,
    slow: `3 x 10–15. Lower for 3 seconds. ${REST}`,
    load: `3 x 8–12. Add a little cable weight. ${REST}`,
    cue: "Kneel facing the stack and curl the ribs down. This replaces a hanging crunch.",
    videoUrl: "https://www.youtube.com/watch?v=AV5PmZJIrrw",
    videoSite: "Colossus Fitness",
    forearm: true,
    forearmNote: "Use a rope or neutral handles. Stop if you feel pain at the plate.",
  },
  {
    name: "Captain's chair knee raise",
    base: `3 x 8–12. Elbow pads. ${REST}`,
    reps: `3 x 12–15. Elbow pads. ${REST}`,
    slow: `3 x 8–12. Lower for 3 seconds. ${REST}`,
    load: `3 x 8–12. A light dumbbell between the feet only if the elbows stay comfortable. ${REST}`,
    cue: "Forearms on the pads, shoulders down. Lift the knees. Do not hang from the hands.",
    videoUrl: "https://www.youtube.com/watch?v=7KDDZtaUaxw",
    videoSite: "Live Lean TV",
    forearm: true,
    forearmNote: "Use the elbow pads. Do not hang from your hands. Stop if you feel pain at the plate.",
  },
];

function absStage(week: number): AbsStage {
  if (week < 2) return "base";
  if (week < 4) return "reps";
  if (week < 6) return "slow";
  return "load";
}

const ABS_STEP: Record<AbsStage, string> = {
  base: "This week, learn the reps. The order is add reps, then slow the lowering, then add a little weight.",
  reps: "This week, add reps. Next, slow the lowering, then add a little weight.",
  slow: "This week, slow the lowering to about 3 seconds. Next, add a little weight.",
  load: "This week, add a little weight where the move allows. Keep the left side comfortable.",
};

function absMove(template: AbsTemplate, week: number): DayMove {
  const stage = absStage(week);
  return {
    name: template.name,
    prescription: template[stage],
    cue: template.cue,
    videoUrl: template.videoUrl,
    videoSite: template.videoSite,
    forearm: template.forearm,
    forearmNote: template.forearmNote,
  };
}

export function absSectionNote(week = 0): string {
  return `10–15 minutes after the main workout and before the cool-down. ${ABS_STEP[absStage(week)]} Visible abs depend mostly on body fat, so keep the calorie target. In a gym, use a cable crunch or a captain’s chair knee raise on the elbow pads. Do not hang from the hands.`;
}

export function absForDay(day: PlanDay, options?: { week?: number; phase?: "home" | "gym"; siblings?: PlanDay[] }): DayMove[] {
  if (!trainingDayGetsAbs(day)) return [];
  const week = options?.week ?? 0;
  const pool = options?.phase === "gym" ? [...ABS_HOME, ...ABS_GYM] : ABS_HOME;
  const siblings = (options?.siblings ?? [day]).filter(trainingDayGetsAbs);
  const index = Math.max(0, siblings.findIndex((item) => item.day === day.day));
  const start = (index * 3) % pool.length;
  return [0, 1, 2].map((offset) => absMove(pool[(start + offset) % pool.length], week));
}

export function libraryAbsMoves(): DayMove[] {
  return [...ABS_HOME, ...ABS_GYM].map((template) => absMove(template, 0));
}

export type LibraryGroup = "All" | "Warm-up" | "Strength" | "Abs & core" | "Stretches" | "Movement breaks";

export type LibraryEntry = DayMove & { group: Exclude<LibraryGroup, "All"> };

export const LIBRARY_GROUPS: LibraryGroup[] = ["All", "Warm-up", "Strength", "Abs & core", "Stretches", "Movement breaks"];

const ABS_LIBRARY_NAMES = new Set(["Dead bug", "Side plank on forearm"]);

export function libraryEntries(): LibraryEntry[] {
  const strength: LibraryEntry[] = LIB.filter((exercise) => !ABS_LIBRARY_NAMES.has(exercise.name)).map((exercise) => ({
    name: exercise.name,
    prescription: exercise.muscles,
    cue: exercise.cue,
    videoUrl: exercise.videoUrl,
    videoSite: exercise.videoSite,
    forearm: loadsForearm(exercise.name),
    group: "Strength",
  }));
  const abs: LibraryEntry[] = libraryAbsMoves().map((move) => ({ ...move, group: "Abs & core" }));
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
    ...abs,
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

export function dayOutline(day: PlanDay, options?: { week?: number; phase?: "home" | "gym"; siblings?: PlanDay[] }): DayOutline {
  const rows = workoutRows(day);
  return {
    warmup: WARMUP,
    workout: rows.map(([name, prescription]) => moveFromPlan(name, prescription)),
    abs: absForDay(day, options),
    absNote: absSectionNote(options?.week ?? 0),
    cooldown: cooldownFor(day.rows),
    snacks: snacks(),
  };
}
