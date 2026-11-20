import { useMemo, useState } from "react";
import { StepsChart, WeightChart } from "../chart";
import { addDays, diffDays, formatPretty, todayISO } from "../dates";
import { planWeight } from "../data";
import { formatSets, setsHaveData } from "../log";
import { useStore } from "../store";
import { backupPayload, parseBackup } from "../storage";
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
        </div>
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
                    {[item.weight ? `${item.weight} lb` : "", item.steps ? `${Number(item.steps).toLocaleString()} steps` : "", item.calories ? `${Number(item.calories).toLocaleString()} cal burned` : ""]
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
