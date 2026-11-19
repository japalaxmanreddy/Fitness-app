import { useCallback, useEffect, useRef, useState } from "react";
import { formatPretty, todayISO } from "./dates";
import { matchExercise } from "./data";
import { formatSets, lastPerformance, prescribedSets, workoutHasData } from "./log";
import { showExercise } from "./nav";
import { useStore } from "./store";
import type { Phase, PlanDays, WorkoutLog } from "./storage";
import { SetEditor } from "./ui";

export function SessionLogger({
  idFor,
  label,
  phase,
  days,
  rows,
  showDemo = true,
}: {
  idFor: (date: string) => string;
  label: string;
  phase: Phase;
  days: PlanDays;
  rows: [string, string][];
  showDemo?: boolean;
}) {
  const { data, upsertWorkout, removeWorkout } = useStore();
  const [date, setDate] = useState(todayISO);
  const makeDraft = useCallback(
    (iso: string, workouts: WorkoutLog[]): WorkoutLog => {
      const id = idFor(iso);
      const existing = workouts.find((workout) => workout.id === id);
      return {
        id,
        date: iso,
        label,
        phase,
        days,
        updatedAt: existing?.updatedAt ?? "",
        exercises: rows.map(([name, prescription]) => {
          const prev = existing?.exercises.find((exercise) => exercise.name === name);
          const blank = prescription
            ? prescribedSets(prescription)
            : Array.from({ length: 3 }, () => ({ weight: "", reps: "" }));
          return {
            name,
            prescription,
            sets: prev && prev.sets.length ? prev.sets.map((set) => ({ ...set })) : blank,
          };
        }),
      };
    },
    [days, idFor, label, phase, rows],
  );

  const [draft, setDraft] = useState(() => makeDraft(todayISO(), data.workouts));
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const timer = useRef<number | null>(null);
  const dirty = useRef(false);

  const commit = useCallback(
    (workout: WorkoutLog) => {
      if (workoutHasData(workout)) upsertWorkout({ ...workout, updatedAt: new Date().toISOString() });
      else removeWorkout(workout.id);
    },
    [removeWorkout, upsertWorkout],
  );

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (dirty.current) commit(draftRef.current);
    },
    [commit],
  );

  function schedule(next: WorkoutLog) {
    dirty.current = true;
    setDraft(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      commit(next);
      dirty.current = false;
    }, 280);
  }

  function changeDate(iso: string) {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (dirty.current) {
      commit(draft);
      dirty.current = false;
    }
    setDate(iso);
    setDraft(makeDraft(iso, data.workouts));
  }

  return (
    <div className="logger">
      <label className="field">
        <span>Date</span>
        <input type="date" value={date} onChange={(event) => changeDate(event.target.value)} />
      </label>
      {draft.exercises.map((exercise, index) => {
        const match = showDemo ? matchExercise(exercise.name) : undefined;
        const previous = lastPerformance(data.workouts, exercise.name, draft.id);
        return (
          <section key={exercise.name} className="lift">
            <div className="lift-top">
              <h3>{exercise.name}</h3>
              {exercise.prescription ? <p className="note">{exercise.prescription}</p> : null}
            </div>
            {match ? (
              <button type="button" className="text-btn" onClick={() => showExercise(match.name)}>
                Watch demo
              </button>
            ) : null}
            <SetEditor
              sets={exercise.sets}
              onChange={(sets) =>
                schedule({
                  ...draft,
                  exercises: draft.exercises.map((item, itemIndex) => (itemIndex === index ? { ...item, sets } : item)),
                })
              }
            />
            {previous ? (
              <p className="note">
                Last time {formatPretty(previous.date)}: {formatSets(previous.sets)}
              </p>
            ) : null}
          </section>
        );
      })}
      <p className="note">Sets save on this phone. Nothing is uploaded.</p>
    </div>
  );
}
