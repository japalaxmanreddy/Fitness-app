import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  STORAGE_KEY,
  loadData,
  normalize,
  saveData,
  type CheckIn,
  type Data,
  type Profile,
  type WorkoutLog,
} from "./storage";

type Store = {
  data: Data;
  saveError: string | null;
  setProfile: (patch: Partial<Profile>) => void;
  upsertCheckin: (checkin: CheckIn) => void;
  removeCheckin: (date: string) => void;
  upsertWorkout: (workout: WorkoutLog) => void;
  removeWorkout: (id: string) => void;
  replaceAll: (data: Data) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(() => loadData());
  const [saveError, setSaveError] = useState<string | null>(null);

  const commit = useCallback((next: Data) => {
    const error = saveData(next);
    queueMicrotask(() => setSaveError(error));
    return next;
  }, []);

  const setProfile = useCallback(
    (patch: Partial<Profile>) => {
      setData((prev) => commit({ ...prev, profile: { ...prev.profile, ...patch } }));
    },
    [commit],
  );

  const upsertCheckin = useCallback(
    (checkin: CheckIn) => {
      setData((prev) => {
        const checkins = prev.checkins.some((item) => item.date === checkin.date)
          ? prev.checkins.map((item) => (item.date === checkin.date ? checkin : item))
          : [...prev.checkins, checkin];
        return commit({ ...prev, checkins });
      });
    },
    [commit],
  );

  const removeCheckin = useCallback(
    (date: string) => {
      setData((prev) => commit({ ...prev, checkins: prev.checkins.filter((item) => item.date !== date) }));
    },
    [commit],
  );

  const upsertWorkout = useCallback(
    (workout: WorkoutLog) => {
      setData((prev) => {
        const workouts = prev.workouts.some((item) => item.id === workout.id)
          ? prev.workouts.map((item) => (item.id === workout.id ? workout : item))
          : [...prev.workouts, workout];
        return commit({ ...prev, workouts });
      });
    },
    [commit],
  );

  const removeWorkout = useCallback(
    (id: string) => {
      setData((prev) => {
        if (!prev.workouts.some((item) => item.id === id)) return prev;
        return commit({ ...prev, workouts: prev.workouts.filter((item) => item.id !== id) });
      });
    },
    [commit],
  );

  const replaceAll = useCallback(
    (next: Data) => {
      setData(commit(next));
    },
    [commit],
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setData(normalize(JSON.parse(event.newValue)));
      } catch {
        /* keep the copy already on screen */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ data, saveError, setProfile, upsertCheckin, removeCheckin, upsertWorkout, removeWorkout, replaceAll }),
    [data, saveError, setProfile, upsertCheckin, removeCheckin, upsertWorkout, removeWorkout, replaceAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}
