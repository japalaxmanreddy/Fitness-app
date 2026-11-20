const OPEN_EXERCISE = "fitness-open-exercise";

export function showExercise(name: string) {
  sessionStorage.setItem(OPEN_EXERCISE, name);
  if (location.hash === "#library") window.dispatchEvent(new Event("hashchange"));
  else location.hash = "library";
}

export function takeExerciseRequest(): string | null {
  const name = sessionStorage.getItem(OPEN_EXERCISE);
  if (name) sessionStorage.removeItem(OPEN_EXERCISE);
  return name;
}

export function goTo(tab: string) {
  location.hash = tab;
}
