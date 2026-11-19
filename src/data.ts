import type { Phase, PlanDays } from "./storage";

export type Group = "All" | "Legs" | "Push" | "Pull" | "Core" | "Cardio";

export type Exercise = {
  name: string;
  group: Exclude<Group, "All">;
  muscles: string;
  cue: string;
  arm: string;
  videoUrl: string;
};

export type Stretch = {
  name: string;
  hold: string;
  cue: string;
  videoUrl: string;
};

export type PlanDay = {
  day: string;
  rows: [string, string][];
};

export const GROUPS: Group[] = ["All", "Legs", "Push", "Pull", "Core", "Cardio"];

export const LIB: Exercise[] = [
  { name: "Goblet squat", group: "Legs", muscles: "Quads, glutes", cue: "Hold one dumbbell vertically at chest, sit down between heels, chest up.", arm: "Cup the top plate with both palms instead of gripping hard.", videoUrl: "" },
  { name: "Bulgarian split squat", group: "Legs", muscles: "Quads, glutes", cue: "Back foot on bench, drop back knee straight down, front heel planted.", arm: "Start bodyweight; add light dumbbells held at sides.", videoUrl: "" },
  { name: "Dumbbell Romanian deadlift", group: "Legs", muscles: "Hamstrings, glutes", cue: "Soft knees, push hips back, dumbbells slide down thighs, flat back.", arm: "Neutral grip; use straps later if grip limits you.", videoUrl: "" },
  { name: "Step-up onto bench", group: "Legs", muscles: "Quads, glutes", cue: "Whole foot on the bench, drive through that heel, lower slowly for 3 seconds.", arm: "Dumbbells at sides; go lighter on the left if grip tires.", videoUrl: "" },
  { name: "Single-leg Romanian deadlift", group: "Legs", muscles: "Hamstrings, glutes, balance", cue: "Hinge on one leg, the other leg reaches back, hips stay square.", arm: "Hold the dumbbell in the right hand at first, or touch the bench with the left for balance.", videoUrl: "" },
  { name: "Hip thrust on bench", group: "Legs", muscles: "Glutes", cue: "Upper back on bench, dumbbell on hips, drive up and squeeze 1 second.", arm: "Rest the dumbbell on hips; hands only steady it.", videoUrl: "" },
  { name: "Neutral-grip dumbbell bench press", group: "Push", muscles: "Chest, triceps", cue: "Palms facing each other, lower to mid-chest, press up and slightly in.", arm: "Neutral grip keeps the wrist straight. Stop if the plate area aches.", videoUrl: "" },
  { name: "Incline dumbbell press", group: "Push", muscles: "Upper chest, shoulders", cue: "Bench at about 30 degrees, elbows at 45 degrees from the body.", arm: "Neutral grip, wrists stacked over elbows.", videoUrl: "" },
  { name: "Seated dumbbell shoulder press", group: "Push", muscles: "Shoulders", cue: "Bench upright, press overhead without arching the low back.", arm: "Neutral grip; go light at first.", videoUrl: "" },
  { name: "Incline push-up on dumbbell handles", group: "Push", muscles: "Chest, triceps", cue: "Hands on dumbbells resting on the bench, body in a straight line.", arm: "Holding handles keeps the wrist straight instead of bent back on a flat palm.", videoUrl: "" },
  { name: "Chest-supported dumbbell row", group: "Pull", muscles: "Upper back, lats", cue: "Lie face down on incline bench, pull elbows back to hips.", arm: "Neutral grip; the bench removes lower-back strain.", videoUrl: "" },
  { name: "One-arm dumbbell row", group: "Pull", muscles: "Lats, upper back", cue: "Knee and hand on bench, pull dumbbell to hip, no twisting.", arm: "When the left arm braces on the bench, use a fist or forearm if a flat palm bothers it.", videoUrl: "" },
  { name: "Rear-delt fly", group: "Pull", muscles: "Rear shoulders", cue: "Chest on incline bench, raise light dumbbells out wide.", arm: "Use the 5 to 10 lb kettlebells or light dumbbells.", videoUrl: "" },
  { name: "Hammer curl", group: "Pull", muscles: "Biceps, forearms", cue: "Palms facing in, curl without swinging.", arm: "Builds the forearm gently. Start light on the left side.", videoUrl: "" },
  { name: "Dead bug", group: "Core", muscles: "Deep core", cue: "Low back pressed down, extend opposite arm and leg slowly.", arm: "No load on the forearm.", videoUrl: "" },
  { name: "Side plank on forearm", group: "Core", muscles: "Obliques", cue: "Elbow under shoulder, hips high, straight line head to feet.", arm: "Weight rests on the elbow and forearm bone, not the wrist.", videoUrl: "" },
  { name: "Kettlebell suitcase carry", group: "Core", muscles: "Core, grip", cue: "One 10 to 15 lb kettlebell at your side, walk tall for 30 to 40 seconds.", arm: "Good gentle grip work. Start with 10 lb on the left side.", videoUrl: "" },
  { name: "Leg press (gym)", group: "Legs", muscles: "Quads, glutes", cue: "Feet shoulder-width, lower until knees near 90 degrees, don't lock out hard.", arm: "No grip load. Your main heavy leg lift in the gym.", videoUrl: "" },
  { name: "Leg curl machine (gym)", group: "Legs", muscles: "Hamstrings", cue: "Curl smoothly, 2 seconds back.", arm: "No grip load.", videoUrl: "" },
  { name: "Machine chest press (gym)", group: "Push", muscles: "Chest, triceps", cue: "Handles at mid-chest, press without shrugging.", arm: "Pick neutral handles if the machine has them.", videoUrl: "" },
  { name: "Triceps rope pushdown (gym)", group: "Push", muscles: "Triceps", cue: "Elbows pinned, spread the rope at the bottom.", arm: "Rope keeps the wrist neutral.", videoUrl: "" },
  { name: "Lat pulldown, neutral grip (gym)", group: "Pull", muscles: "Lats", cue: "Pull the handle to upper chest, chest up.", arm: "Use wrist straps once the weight gets heavy.", videoUrl: "" },
  { name: "Seated cable row (gym)", group: "Pull", muscles: "Mid back", cue: "Sit tall, pull to the belly, squeeze shoulder blades.", arm: "Neutral V-handle.", videoUrl: "" },
  { name: "Cable face pull (gym)", group: "Pull", muscles: "Rear shoulders, upper back", cue: "Rope at face height, pull to forehead, elbows high.", arm: "Light load, easy on the wrist.", videoUrl: "" },
  { name: "Pallof press (gym)", group: "Core", muscles: "Core, anti-rotation", cue: "Stand sideways to cable, press straight out, resist the twist.", arm: "Light load.", videoUrl: "" },
  { name: "Bike, steady", group: "Cardio", muscles: "Heart, legs", cue: "20 to 40 minutes at a pace where you can still talk in full sentences.", arm: "No arm load.", videoUrl: "" },
  { name: "Bike, intervals", group: "Cardio", muscles: "Heart, legs", cue: "After warm-up, 30 seconds hard and 90 seconds easy, 6 to 8 rounds.", arm: "No arm load.", videoUrl: "" },
];

export const STRETCHES: Stretch[] = [
  { name: "Kneeling hip flexor stretch", hold: "30 sec per side", cue: "Back knee on a pad, squeeze that glute, and shift hips forward until the front of the hip stretches.", videoUrl: "" },
  { name: "Hamstring stretch on the bench", hold: "30 sec per side", cue: "Heel on the bench, leg straight, hinge forward from the hips with a flat back.", videoUrl: "" },
  { name: "Figure-4 glute stretch", hold: "30 sec per side", cue: "On your back, cross one ankle over the other knee and pull the bottom leg toward your chest.", videoUrl: "" },
  { name: "Doorway chest stretch", hold: "30 sec", cue: "Forearm on the door frame at shoulder height, step through until the chest stretches.", videoUrl: "" },
  { name: "Child's pose with reach", hold: "45 sec", cue: "Knees wide, sit back toward your heels, reach your arms long and breathe slowly.", videoUrl: "" },
  { name: "Cat-cow", hold: "8 slow reps", cue: "On hands and knees, round your back up, then let it sink as you lift your head.", videoUrl: "" },
  { name: "Gentle forearm flexor and extensor stretch", hold: "20 sec each, both arms", cue: "Arm straight out, gently pull the fingers back, then down. Never force the left wrist.", videoUrl: "" },
  { name: "Calf stretch on a wall", hold: "30 sec per side", cue: "Hands on the wall, back leg straight with heel down, lean in.", videoUrl: "" },
];

export const PLAN3: PlanDay[] = [
  { day: "Monday, Workout A", rows: [["Goblet squat", "3 x 8-12"], ["Neutral-grip dumbbell bench press", "3 x 8-12"], ["Chest-supported dumbbell row", "3 x 10-12"], ["Dumbbell Romanian deadlift", "3 x 10-12"], ["Dead bug", "3 x 8 per side"], ["Bike, steady (after lifting)", "15 min"]] },
  { day: "Wednesday, Workout B", rows: [["Bulgarian split squat", "3 x 8-10 per leg"], ["Incline dumbbell press", "3 x 8-12"], ["One-arm dumbbell row", "3 x 10-12 per arm"], ["Hip thrust on bench", "3 x 10-15"], ["Side plank on forearm", "3 x 20-30 sec per side"], ["Bike, steady (after lifting)", "15 min"]] },
  { day: "Friday, Workout A", rows: [["Goblet squat", "3 x 8-12"], ["Seated dumbbell shoulder press", "3 x 8-12"], ["Chest-supported dumbbell row", "3 x 10-12"], ["Dumbbell Romanian deadlift", "3 x 10-12"], ["Hammer curl", "2 x 10-12"], ["Kettlebell suitcase carry", "3 x 30 sec per side"]] },
  { day: "Tuesday and Saturday", rows: [["Bike, steady", "30-40 min"], ["Full stretch routine", "10 min"]] },
];

export const PLAN4: PlanDay[] = [
  { day: "Monday, Upper", rows: [["Neutral-grip dumbbell bench press", "3 x 8-12"], ["Chest-supported dumbbell row", "3 x 10-12"], ["Seated dumbbell shoulder press", "3 x 8-12"], ["One-arm dumbbell row", "2 x 10-12 per arm"], ["Hammer curl", "2 x 10-12"], ["Dead bug", "3 x 8 per side"]] },
  { day: "Tuesday, Lower", rows: [["Goblet squat", "3 x 8-12"], ["Dumbbell Romanian deadlift", "3 x 10-12"], ["Bulgarian split squat", "2 x 8-10 per leg"], ["Hip thrust on bench", "3 x 10-15"], ["Side plank on forearm", "3 x 20-30 sec per side"]] },
  { day: "Thursday, Upper", rows: [["Incline dumbbell press", "3 x 8-12"], ["One-arm dumbbell row", "3 x 10-12 per arm"], ["Incline push-up on dumbbell handles", "2 x max reps, stop 2 short of failure"], ["Rear-delt fly", "3 x 12-15"], ["Kettlebell suitcase carry", "3 x 30 sec per side"]] },
  { day: "Friday, Lower", rows: [["Bulgarian split squat", "3 x 8-10 per leg"], ["Hip thrust on bench", "3 x 10-15"], ["Dumbbell Romanian deadlift", "3 x 10-12"], ["Goblet squat", "2 x 12-15"], ["Dead bug", "3 x 8 per side"]] },
  { day: "Wednesday and Saturday", rows: [["Bike, intervals on one day, steady on the other", "20-35 min"], ["Full stretch routine", "10 min"]] },
];

export const PLAN5: PlanDay[] = [
  { day: "Monday, Upper", rows: [["Neutral-grip dumbbell bench press", "3 x 8-12"], ["Chest-supported dumbbell row", "3 x 10-12"], ["Seated dumbbell shoulder press", "3 x 8-12"], ["One-arm dumbbell row", "2 x 10-12 per arm"], ["Hammer curl", "2 x 10-12"], ["Stretch routine", "10 min"]] },
  { day: "Tuesday, Lower and core", rows: [["Bulgarian split squat", "3 x 8-10 per leg"], ["Dumbbell Romanian deadlift", "3 x 10-12"], ["Step-up onto bench", "3 x 10 per leg"], ["Hip thrust on bench", "3 x 10-15"], ["Dead bug", "3 x 8 per side"], ["Side plank on forearm", "2 x 20-30 sec per side"], ["Stretch routine", "10 min"]] },
  { day: "Wednesday, Bike and mobility", rows: [["Bike, easy warm-up", "5 min"], ["Bike, intervals", "6-8 rounds of 30 sec hard, 90 sec easy"], ["Bike, easy cool-down", "5 min"], ["Full stretch routine", "15 min"]] },
  { day: "Thursday, Upper", rows: [["Incline dumbbell press", "3 x 8-12"], ["One-arm dumbbell row", "3 x 10-12 per arm"], ["Incline push-up on dumbbell handles", "2 x stop 2 reps short of failure"], ["Rear-delt fly", "3 x 12-15"], ["Kettlebell suitcase carry", "3 x 30 sec per side"], ["Stretch routine", "10 min"]] },
  { day: "Friday, Lower and core", rows: [["Goblet squat, 3 seconds down", "3 x 10-12"], ["Single-leg Romanian deadlift", "3 x 8-10 per leg"], ["Bulgarian split squat", "2 x 10-12 per leg"], ["Hip thrust on bench", "3 x 12-15"], ["Dead bug", "3 x 8 per side"], ["Stretch routine", "10 min"]] },
  { day: "Saturday or Sunday", rows: [["Easy walk or bike ride", "30-45 min"]] },
];

export const GYM5: PlanDay[] = [
  { day: "Monday, Upper", rows: [["Machine chest press", "3 x 8-12"], ["Lat pulldown, neutral grip", "3 x 8-12"], ["Seated cable row", "3 x 10-12"], ["Seated dumbbell shoulder press", "3 x 8-12"], ["Cable face pull", "3 x 12-15"], ["Hammer curl", "2 x 10-12"], ["Stretch routine", "10 min"]] },
  { day: "Tuesday, Lower and core", rows: [["Leg press", "4 x 8-12"], ["Dumbbell Romanian deadlift, straps OK", "3 x 8-10"], ["Leg curl machine", "3 x 10-12"], ["Bulgarian split squat", "2 x 10 per leg"], ["Dead bug", "3 x 8 per side"], ["Stretch routine", "10 min"]] },
  { day: "Wednesday, Bike and mobility", rows: [["Bike, easy warm-up", "5 min"], ["Bike, intervals", "6-8 rounds of 30 sec hard, 90 sec easy"], ["Bike, easy cool-down", "5 min"], ["Full stretch routine", "15 min"]] },
  { day: "Thursday, Upper", rows: [["Incline dumbbell press", "3 x 8-12"], ["Chest-supported row machine", "3 x 8-12"], ["Lat pulldown, neutral grip", "3 x 10-12"], ["Rear-delt fly", "3 x 12-15"], ["Triceps rope pushdown", "2 x 12-15"], ["Stretch routine", "10 min"]] },
  { day: "Friday, Lower and core", rows: [["Goblet squat or hack squat machine", "3 x 8-12"], ["Hip thrust, machine or barbell", "3 x 8-12"], ["Single-leg Romanian deadlift", "2 x 10 per leg"], ["Leg press, high reps", "2 x 15-20"], ["Pallof press", "3 x 10 per side"], ["Stretch routine", "10 min"]] },
  { day: "Saturday or Sunday", rows: [["Easy walk or bike ride", "30-45 min"]] },
];

export const PROGRESS_STEPS: { title: string; detail: string }[] = [
  { title: "Weeks 1 and 2: learn the moves", detail: "Use weights you could lift 3 to 4 more times at the end of each set. Your left arm sets the pace." },
  { title: "Add reps first", detail: "When you reach the top of the rep range on every set, move on to the next step." },
  { title: "Then add weight", detail: "Go up 2.5 to 5 lb on upper-body lifts and 5 lb on leg lifts, then build the reps back up." },
  { title: "Once you hit 35 lb, the max on your dumbbells", detail: "Keep progressing by lowering for 3 seconds, pausing at the bottom, adding reps, or switching to single-leg versions." },
  { title: "Every 6th week, go lighter", detail: "Do the same workouts at about 70 percent of your weights so your joints can recover." },
];

export const FOREARM_RULES = [
  "Use a neutral grip, palms facing each other, on presses and rows.",
  "Push up on dumbbell handles, not on flat palms, to avoid bending the wrist back.",
  "Skip kettlebell swings and heavy wrist curls for the first 8 weeks.",
  "Add grip work slowly with hammer curls and suitcase carries.",
];

export const WARMUP: { title: string; detail: string }[] = [
  { title: "Bike, easy", detail: "5 minutes." },
  { title: "Arm circles and wrist circles", detail: "10 each direction, gentle." },
  { title: "Bodyweight squats", detail: "10 slow reps." },
  { title: "Hip hinge with hands on hips", detail: "10 reps." },
  { title: "Kettlebell halo, 5 lb", detail: "5 each direction, light." },
  { title: "One light set of your first lift", detail: "About half your working weight." },
];

export const PROTEIN_FOODS: { label: string; value: string }[] = [
  { label: "Each meal", value: "30 to 45 g of protein" },
  { label: "Chicken breast, 6 oz cooked", value: "About 50 g" },
  { label: "Salmon or tilapia, 6 oz", value: "About 35 to 40 g" },
  { label: "Shrimp, 6 oz", value: "About 35 g" },
  { label: "Greek yogurt, 1 cup", value: "About 20 to 23 g" },
  { label: "3 eggs", value: "About 18 g" },
  { label: "Whey protein, 1 scoop", value: "About 24 g" },
];

export function planFor(phase: Phase, days: PlanDays): PlanDay[] {
  if (phase === "gym") return GYM5;
  if (days === "3") return PLAN3;
  if (days === "4") return PLAN4;
  return PLAN5;
}

export function exercisesIn(group: Group): Exercise[] {
  return group === "All" ? LIB : LIB.filter((exercise) => exercise.group === group);
}

const STOP = new Set(["on", "or", "the", "and", "with", "per", "for", "from", "into", "after"]);

function norm(value: string): string {
  return value.toLowerCase().replace(/\(gym\)/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function words(value: string): string[] {
  return norm(value).split(" ").filter((word) => word.length > 2 && !STOP.has(word));
}

export function matchExercise(name: string): Exercise | undefined {
  const n = norm(name);
  let best: Exercise | undefined;
  let bestScore = 0;
  for (const exercise of LIB) {
    const en = norm(exercise.name);
    let score = 0;
    if (n === en) score = 1000 + en.length;
    else if (n.startsWith(en) || en.startsWith(n)) score = 500 + Math.min(n.length, en.length);
    if (n.includes("bike") && en.includes("bike")) {
      const interval = n.includes("interval");
      if (interval === en.includes("interval")) score = Math.max(score, 400);
    }
    const overlap = words(en).filter((word) => words(n).includes(word));
    if (overlap.length >= 2) score = Math.max(score, 80 + overlap.join("").length);
    const shared = sharedPrefix(n, en);
    if (shared >= 2) score = Math.max(score, 120 + shared * 15);
    if (score > bestScore) {
      best = exercise;
      bestScore = score;
    }
  }
  return best;
}

function sharedPrefix(a: string, b: string): number {
  const left = a.split(" ");
  const right = b.split(" ");
  let i = 0;
  while (i < left.length && i < right.length && left[i] === right[i]) i += 1;
  return i;
}

export function suggestedDay(plan: PlanDay[], date = new Date()): PlanDay | null {
  const name = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const exact = plan.find((day) => day.day.toLowerCase().startsWith(name));
  if (exact) return exact;
  if (name === "saturday" || name === "sunday") {
    return plan.find((day) => /saturday|sunday/i.test(day.day)) ?? null;
  }
  return null;
}

export function planWeight(week: number): number {
  const i = Math.max(0, Math.min(18, week));
  return Math.max(177, 195 - i);
}
