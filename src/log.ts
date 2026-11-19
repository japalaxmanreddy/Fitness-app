import type { SetLog, WorkoutLog } from "./storage";

export function prescribedSets(prescription: string): SetLog[] {
  const match = /^(\d+)\s*x/i.exec(prescription.trim());
  const count = match ? Math.min(8, Math.max(1, Number(match[1]))) : 1;
  return Array.from({ length: count }, () => ({ weight: "", reps: "" }));
}

export function setsHaveData(sets: SetLog[]): boolean {
  return sets.some((set) => set.weight.trim() !== "" || set.reps.trim() !== "");
}

export function workoutHasData(workout: WorkoutLog): boolean {
  return workout.exercises.some((exercise) => setsHaveData(exercise.sets));
}

export function formatSets(sets: SetLog[]): string {
  return sets
    .filter((set) => set.weight.trim() || set.reps.trim())
    .map((set) => {
      const weight = set.weight.trim();
      const reps = set.reps.trim();
      if (weight && reps) return `${weight} lb × ${reps}`;
      if (reps) return reps;
      return `${weight} lb`;
    })
    .join(", ");
}

export function lastPerformance(
  workouts: WorkoutLog[],
  name: string,
  exceptId?: string,
): { date: string; sets: SetLog[] } | null {
  const hits = workouts
    .filter((workout) => workout.id !== exceptId)
    .flatMap((workout) =>
      workout.exercises
        .filter((exercise) => exercise.name === name && setsHaveData(exercise.sets))
        .map((exercise) => ({
          date: workout.date,
          sets: exercise.sets,
          updatedAt: workout.updatedAt,
        })),
    )
    .sort((a, b) => (a.date === b.date ? b.updatedAt.localeCompare(a.updatedAt) : b.date.localeCompare(a.date)));
  const top = hits[0];
  return top ? { date: top.date, sets: top.sets } : null;
}
