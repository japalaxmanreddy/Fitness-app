import { useMemo, useState } from "react";
import type { CheckIn, MetricSource } from "../storage";
import { StepsChart, WeightChart } from "../chart";
import { addDays, diffDays, formatPretty, todayISO } from "../dates";
import { planWeight } from "../data";
import { FAST_LOSS_NOTE, TWO_WEEK_RISE_NOTE, describeWeek, weeklyAverages, weighPoints } from "../weight-trend";
import { formatSets, setsHaveData } from "../log";
import { useStore } from "../store";
import { backupPayload, parseBackup } from "../storage";
import { Devices } from "./Devices";
import { Field } from "../ui";

export function Progress() {
  const { data, setProfile, removeCheckin, removeWorkout, replaceAll } = useStore();
  const today = todayISO();
  const [importError, setImportError] = useState("");
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const weighIns = data.checkins
    .filter((item) => Number(item.weight) > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  const recentWeights = weighIns.filter((item) => {
    const ago = diffDays(item.date, today);
    return ago >= 0 && ago <= 6;
  });
  const average =
    recentWeights.length > 0
      ? recentWeights.reduce((sum, item) => sum + Number(item.weight), 0) / recentWeights.length
      : null;
  const weekTrend = describeWeek(weeklyAverages(weighPoints(data.checkins)));
  const weekIndex = Math.max(0, Math.min(18, Math.floor(diffDays(data.profile.planStart, today) / 7)));
  const plannedNow = diffDays(data.profile.planStart, today) < 0 ? 195 : planWeight(weekIndex);
  const workouts = useMemo(
    () =>
      [...data.workouts]
        .filter((workout) => workout.exercises.some((exercise) => setsHaveData(exercise.sets)))
        .sort((a, b) => (a.date === b.date ? b.updatedAt.localeCompare(a.updatedAt) : b.date.localeCompare(a.date))),
    [data.workouts],
  );

  function exportJson() {
    const blob = new Blob([backupPayload(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitness-backup-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        parseBackup(JSON.parse(text));
        setPendingFile(text);
        setImportError("");
      } catch {
        setPendingFile(null);
        setImportError("That file could not be read. Use a backup exported from this app.");
      }
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!pendingFile) return;
    replaceAll(parseBackup(JSON.parse(pendingFile)));
    setPendingFile(null);
    setImportError("");
  }

  return (
    <div className="stack-lg">
      <div>
        <h1>Progress</h1>
        <p className="lede">A plan at about 1 lb a week, from 195 lb down to 177 lb over 18 weeks. Logged mornings draw on top of the line.</p>
      </div>
      <Devices />
      <DeviceMetrics checkins={data.checkins} />

      <section className="card stack">
        <h2>Weight plan</h2>
        <WeightChart planStart={data.profile.planStart} checkins={data.checkins} />
        <p className="note">
          This is a plan at about 1 lb a week, not a prediction. Weigh yourself 3 mornings a week and track the weekly average. Log those mornings on Today and they plot here.
        </p>
        <div className="metrics">
          <article className="metric">
            <p className="metric-value">{plannedNow}</p>
            <p className="metric-label">Planned this week</p>
            <p className="metric-detail">Week {weekIndex} of 18</p>
          </article>
          <article className="metric">
            <p className="metric-value">{average === null ? "—" : average.toFixed(1)}</p>
            <p className="metric-label">7-day average</p>
            <p className="metric-detail">{recentWeights.length ? `${recentWeights.length} weigh-in${recentWeights.length === 1 ? "" : "s"}` : "No weigh-ins yet"}</p>
          </article>
          <article className="metric">
            <p className="metric-value">{weekTrend.change === null ? "—" : `${weekTrend.change > 0 ? "+" : ""}${weekTrend.change.toFixed(1)}`}</p>
            <p className="metric-label">Weekly average change</p>
            <p className="metric-detail">
              {weekTrend.current ? `${weekTrend.current.average.toFixed(1)} lb this week` : "Need two weeks of weigh-ins"}
            </p>
          </article>
        </div>
        {weekTrend.flag === "fast" ? <p className="note warn-text">{FAST_LOSS_NOTE}</p> : null}
        {weekTrend.flag === "up" ? <p className="note">{TWO_WEEK_RISE_NOTE}</p> : null}
        <Field label="Plan start" type="date" value={data.profile.planStart} onChange={(planStart) => setProfile({ planStart })} />
        <p className="note">Week 0 is {formatPretty(data.profile.planStart)}. Week 18 is {formatPretty(addDays(data.profile.planStart, 126))} at 177 lb.</p>
      </section>

      <section className="card stack">
        <h2>Steps</h2>
        <p className="note">Last 14 days. The dashed line is 8,000 steps.</p>
        <StepsChart checkins={data.checkins} today={today} />
      </section>

      <section className="card stack">
        <h2>Weigh-ins</h2>
        {data.checkins.length === 0 ? <p className="note">None yet. Add a morning weight on Today.</p> : null}
        <ul className="history">
          {[...data.checkins]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((item) => (
              <li key={item.date}>
                <div>
                  <strong>{formatPretty(item.date)}</strong>
                  <p className="note">
                    {[
                      item.weight ? `${item.weight} lb${sourceTag(item.weightSource)}` : "",
                      item.steps ? `${Number(item.steps).toLocaleString()} steps${sourceTag(item.stepsSource)}` : "",
                      item.calories ? `${Number(item.calories).toLocaleString()} cal burned${sourceTag(item.caloriesSource)}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Empty"}
                  </p>
                </div>
                <button type="button" className="text-btn" onClick={() => removeCheckin(item.date)}>
                  Remove
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section className="card stack">
        <h2>Logged sessions</h2>
        {workouts.length === 0 ? <p className="note">None yet. Log a session from Workouts.</p> : null}
        <ul className="history">
          {workouts.slice(0, 20).map((workout) => (
            <li key={workout.id}>
              <div>
                <strong>
                  {formatPretty(workout.date)} · {workout.label}
                </strong>
                {workout.exercises
                  .filter((exercise) => setsHaveData(exercise.sets))
                  .map((exercise) => (
                    <p key={exercise.name} className="note">
                      {exercise.name}: {formatSets(exercise.sets)}
                    </p>
                  ))}
              </div>
              <button type="button" className="text-btn" onClick={() => removeWorkout(workout.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack">
        <h2>Backup</h2>
        <p className="note">Export is a JSON file you can keep. Import replaces the logs on this phone.</p>
        <div className="row-actions">
          <button type="button" className="btn primary" onClick={exportJson}>
            Export JSON
          </button>
          <label className="btn">
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {importError ? <p className="note warn-text">{importError}</p> : null}
        {pendingFile ? (
          <div className="confirm">
            <p>Replace everything saved on this phone with this file?</p>
            <div className="row-actions">
              <button type="button" className="btn primary" onClick={confirmImport}>
                Replace
              </button>
              <button type="button" className="btn" onClick={() => setPendingFile(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function sourceTag(source?: MetricSource): string {
  if (source === "withings") return " · Withings";
  if (source === "fitbit") return " · Fitbit";
  if (source === "manual") return " · Typed in";
  return "";
}

function latest(checkins: CheckIn[], pick: (item: CheckIn) => string | undefined): string {
  const found = [...checkins].sort((a, b) => b.date.localeCompare(a.date)).find((item) => pick(item));
  return found ? pick(found) || "" : "";
}

function DeviceMetrics({ checkins }: { checkins: CheckIn[] }) {
  const fat = latest(checkins, (item) => item.fatPct);
  const muscle = latest(checkins, (item) => item.muscleLb);
  const bmi = latest(checkins, (item) => item.bmi);
  const heart = latest(checkins, (item) => item.restingHr);
  const sleep = latest(checkins, (item) => item.sleepMinutes);
  const active = latest(checkins, (item) => item.activeMinutes);
  if (!fat && !muscle && !bmi && !heart && !sleep && !active) return null;
  const sleepHours = sleep ? (Number(sleep) / 60).toFixed(1) : "";
  return (
    <section className="card stack">
      <h2>From your devices</h2>
      <div className="metrics">
        {fat ? <article className="metric"><p className="metric-value">{fat}%</p><p className="metric-label">Fat</p><p className="metric-detail">Withings</p></article> : null}
        {muscle ? <article className="metric"><p className="metric-value">{muscle}</p><p className="metric-label">Muscle, lb</p><p className="metric-detail">Withings</p></article> : null}
        {bmi ? <article className="metric"><p className="metric-value">{bmi}</p><p className="metric-label">BMI</p><p className="metric-detail">Withings</p></article> : null}
        {heart ? <article className="metric"><p className="metric-value">{heart}</p><p className="metric-label">Resting heart rate</p><p className="metric-detail">Fitbit</p></article> : null}
        {sleepHours ? <article className="metric"><p className="metric-value">{sleepHours}</p><p className="metric-label">Sleep, hours</p><p className="metric-detail">Latest night</p></article> : null}
        {active ? <article className="metric"><p className="metric-value">{active}</p><p className="metric-label">Active minutes</p><p className="metric-detail">Fitbit</p></article> : null}
      </div>
    </section>
  );
}
