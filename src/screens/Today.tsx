import { useEffect, useRef, useState } from "react";
import { addDays, todayISO } from "../dates";
import { planFor, suggestedDay } from "../data";
import { devicesConfigured } from "../device-config";
import { deviceStatus, lastSyncTime, syncDevices } from "../devices";
import { DayBody } from "../day-view";
import { workoutRows } from "../day-plan";
import { readProfilePhoto, saveProfilePhoto } from "../photo";
import { mergeRuns } from "../runs";
import { SessionLogger } from "../session";
import { useStore } from "../store";
import { mergeSync } from "../sync-merge";
import { coachTips } from "../tips";
import { ABS_PHASES, absRoadmap } from "../weight-trend";

const DEFAULT_GOAL = "Visible abs in 12 months, lean and muscular";

function syncLabel(iso: string): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "";
  return new Date(time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function sleepText(minutes: string | undefined): string {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  const hours = Math.floor(value / 60);
  const remain = Math.round(value % 60);
  return `${hours}h ${remain}m`;
}

function Bars({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  const width = values.length * 14;
  return (
    <svg className="spark" viewBox={`0 0 ${width} 36`} role="img" aria-label={label}>
      {values.map((value, index) => {
        const height = value > 0 ? Math.max(2, (value / max) * 32) : 0;
        return <rect key={index} x={index * 14 + 2} y={34 - height} width={10} height={height} rx={2} />;
      })}
    </svg>
  );
}

export function Today() {
  const { data, setProfile, setCheckins, setRuns } = useStore();
  const { profile } = data;
  const today = todayISO();
  const yesterday = addDays(today, -1);
  const plan = planFor(profile.phase, profile.days);
  const todayPlan = suggestedDay(plan);
  const road = absRoadmap(data.checkins, profile.planStart, today);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [goal, setGoal] = useState(profile.goal || DEFAULT_GOAL);
  const [fitbit, setFitbit] = useState(false);
  const [syncedAt, setSyncedAt] = useState(lastSyncTime);
  const [syncNote, setSyncNote] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = devicesConfigured();

  useEffect(() => {
    void readProfilePhoto().then(setPhoto);
  }, []);

  useEffect(() => {
    if (!configured) return;
    let cancel = false;
    deviceStatus()
      .then((links) => {
        if (!cancel) setFitbit(links.fitbit);
      })
      .catch(() => {
        if (!cancel) setFitbit(false);
      });
    return () => {
      cancel = true;
    };
  }, [configured]);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError("");
    try {
      setPhoto(await saveProfilePhoto(file));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Could not save that photo.");
    }
  }

  async function onSync() {
    setBusy(true);
    try {
      const payload = await syncDevices();
      setFitbit(payload.connected.fitbit);
      setCheckins(mergeSync(data.checkins, payload.days));
      if (payload.connected.fitbit && payload.activities) setRuns(mergeRuns(data.runs, payload.activities, addDays(today, -29)));
      setSyncedAt(lastSyncTime());
      setSyncNote(payload.warnings[0] || "Synced.");
    } catch (error) {
      setSyncNote(error instanceof Error ? error.message : "Sync did not finish.");
    } finally {
      setBusy(false);
    }
  }

  const todayRow = data.checkins.find((item) => item.date === today);
  const night = todayRow?.sleepMinutes || data.checkins.find((item) => item.date === yesterday)?.sleepMinutes;
  const distance = data.runs.filter((run) => run.date === today).reduce((sum, run) => sum + run.distanceMi, 0);
  const hasToday = Boolean(todayRow?.steps || todayRow?.calories || todayRow?.activeMinutes || todayRow?.restingHr || night || distance > 0);
  const week = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const weekRows = week.map((date) => data.checkins.find((item) => item.date === date));
  const hrValues = weekRows.map((row) => Number(row?.restingHr) || 0);
  const calorieValues = weekRows.map((row) => Number(row?.calories) || 0);
  const sleepValues = weekRows.map((row) => Number(row?.sleepMinutes) || 0).filter((value) => value > 0);
  const sleepAvg = sleepValues.length ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length : 0;
  const calorieDays = calorieValues.filter((value) => value > 0);
  const calorieTotal = calorieDays.reduce((sum, value) => sum + value, 0);
  const tips = coachTips({ today, plan, checkins: data.checkins, runs: data.runs, workouts: data.workouts, todayPlan });
  const logged = data.workouts.some((workout) => workout.date === today && workout.label === todayPlan?.day);

  return (
    <div className="stack-lg">
      <section className="hero card">
        <button type="button" className="avatar" onClick={() => fileRef.current?.click()} aria-label={photo ? "Change profile photo" : "Add a profile photo"}>
          {photo ? <img src={photo} alt="" /> : <span>Photo</span>}
        </button>
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={(event) => {
            void onPhoto(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="hero-copy">
          <p className="eyebrow">Today</p>
          <label className="goal">
            <span className="visually-hidden">Goal</span>
            <textarea
              rows={2}
              maxLength={140}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              onBlur={() => {
                const next = goal.trim();
                setGoal(next || DEFAULT_GOAL);
                setProfile({ goal: next });
              }}
            />
          </label>
          <p className="note">
            {ABS_PHASES[road.phase].title}
            {road.hasLog ? ` · 7-day average ${road.average.toFixed(1)} lb` : " · from 195 lb"}
            {" · "}
            {Math.round(road.percent * 100)}% toward 174–180
          </p>
          <details className="roadmap-fold">
            <summary>See roadmap</summary>
            <p className="note">A guide, not a guarantee. Visible abs depend mostly on body fat.</p>
            <ol className="road-phases">
              {ABS_PHASES.map((phase, index) => (
                <li key={phase.title} className={index === road.phase ? "current" : undefined}>
                  <strong>
                    {phase.title}
                    {index === road.phase ? " · now" : ""}
                  </strong>
                  <span>{phase.detail}</span>
                </li>
              ))}
            </ol>
          </details>
          {photoError ? <p className="note">{photoError}</p> : null}
        </div>
      </section>

      <section className="card stack">
        <div className="row-spread">
          <h2>Today from Fitbit</h2>
          {configured ? (
            <button type="button" className="btn" onClick={() => void onSync()} disabled={busy}>
              {busy ? "Syncing" : "Sync"}
            </button>
          ) : null}
        </div>
        {syncedAt ? <p className="note">Last synced {syncLabel(syncedAt)}</p> : null}
        {!configured ? <p className="note">Fitbit isn’t connected. Turn it on from Progress.</p> : null}
        {configured && !fitbit && !hasToday ? <p className="note">Fitbit isn’t connected yet. Connect it on Progress, then sync.</p> : null}
        {configured && fitbit && !hasToday ? <p className="note">No numbers for today yet. Sync to pull them.</p> : null}
        {hasToday ? (
          <div className="metrics">
            <Stat label="Steps" value={todayRow?.steps ? Number(todayRow.steps).toLocaleString() : "—"} />
            <Stat label="Distance" value={distance > 0 ? `${distance.toFixed(1)} mi` : "—"} />
            <Stat label="Active minutes" value={todayRow?.activeMinutes || "—"} />
            <Stat label="Calories burned" value={todayRow?.calories ? Number(todayRow.calories).toLocaleString() : "—"} />
            <Stat label="Resting heart rate" value={todayRow?.restingHr ? `${todayRow.restingHr} bpm` : "—"} />
            <Stat label="Last night's sleep" value={sleepText(night)} />
          </div>
        ) : null}
        {syncNote ? <p className="note">{syncNote}</p> : null}
      </section>

      <section className="card stack">
        <h2>Last 7 days</h2>
        <div className="week-stat">
          <p>
            Resting heart rate <strong>{hrValues.filter((value) => value > 0).length ? `${Math.round(hrValues.filter((value) => value > 0).reduce((sum, value) => sum + value, 0) / hrValues.filter((value) => value > 0).length)} bpm avg` : "—"}</strong>
          </p>
          <Bars values={hrValues} label="Resting heart rate for the last 7 days" />
        </div>
        <div className="week-stat">
          <p>
            Sleep <strong>{sleepAvg ? sleepText(String(sleepAvg)) + " avg" : "—"}</strong>
          </p>
          <Bars values={weekRows.map((row) => Number(row?.sleepMinutes) || 0)} label="Sleep minutes for the last 7 days" />
        </div>
        <div className="week-stat">
          <p>
            Calories burned <strong>{calorieTotal ? `${calorieTotal.toLocaleString()} total` : "—"}</strong>
            {calorieDays.length ? ` · ${Math.round(calorieTotal / calorieDays.length).toLocaleString()} a day` : ""}
          </p>
          <Bars values={calorieValues} label="Calories burned for the last 7 days" />
        </div>
      </section>

      <section className="card stack">
        <h2>Today's workout</h2>
        {todayPlan ? (
          <>
            <p className="note">
              {todayPlan.day}
              {logged ? " · logged" : ""}
            </p>
            <DayBody
              day={todayPlan}
              log={
                <SessionLogger
                  label={todayPlan.day}
                  phase={profile.phase}
                  days={profile.days}
                  rows={workoutRows(todayPlan)}
                  idFor={(date) => `${date}|${profile.phase}|${todayPlan.day}`}
                />
              }
            />
          </>
        ) : (
          <p className="note">No workout is scheduled today. The evening walk is on the Running tab.</p>
        )}
      </section>

      <section className="card stack">
        <h2>Tips</h2>
        <ul className="tips">
          {tips.map((tip) => (
            <li key={tip.title}>
              <strong>{tip.title}</strong>
              <span>{tip.reason}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric">
      <p className="metric-value compact">{value}</p>
      <p className="metric-label">{label}</p>
    </article>
  );
}
