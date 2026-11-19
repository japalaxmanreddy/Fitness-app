const OPEN_EXERCISE = "fitness-open-exercise";

export function showExercise(name: string) {
  sessionStorage.setItem(OPEN_EXERCISE, name);
  if (location.hash === "#exercises") window.dispatchEvent(new Event("hashchange"));
  else location.hash = "exercises";
}

export function takeExerciseRequest(): string | null {
  const name = sessionStorage.getItem(OPEN_EXERCISE);
  if (name) sessionStorage.removeItem(OPEN_EXERCISE);
  return name;
}

export function goTo(tab: string) {
  location.hash = tab;
}
