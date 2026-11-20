import { useEffect, useState } from "react";
import { devicesConfigured } from "../device-config";
import { deviceStatus } from "../devices";
import { formatPretty, todayISO } from "../dates";
import { planFor } from "../data";
import { HrChart, MilesChart, PaceChart } from "../run-charts";
import {
  EASY_HR_LIMIT,
  easyHrHigh,
  eveningForDate,
  eveningPlans,
  fitnessNote,
  fitnessTrend,
  formatDuration,
  formatMiles,
  formatPace,
  paceSeconds,
  roadStatus,
  weekdayLabel,
  weeklySeries,
  type RunKind,
  type RunLog,
} from "../runs";
import { useStore } from "../store";
import { Field, SelectField } from "../ui";

function zoneLine(run: RunLog): string {
  if (!run.zones) return "";
  const parts = [
    run.zones.out !== undefined ? `Out ${run.zones.out} min` : "",
    run.zones.fatBurn !== undefined ? `Fat burn ${run.zones.fatBurn} min` : "",
    run.zones.cardio !== undefined ? `Cardio ${run.zones.cardio} min` : "",
    run.zones.peak !== undefined ? `Peak ${run.zones.peak} min` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

export function Running() {
  const { data, upsertRun, removeRun } = useStore();
  const today = todayISO();
  const plan = planFor(data.profile.phase, data.profile.days);
  const status = roadStatus(data.runs, today);
  const schedule = eveningPlans(plan);
  const tonight = eveningForDate(plan, today);
  const series = weeklySeries(data.runs, today);
  const fitness = fitnessTrend(data.runs);
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("18:00");
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [kind, setKind] = useState<RunKind>(tonight.kind === "hard" ? "run" : "walk");
  const [hr, setHr] = useState("");
  const [message, setMessage] = useState("");
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const runs = [...data.runs].sort((a, b) => (a.date === b.date ? b.start.localeCompare(a.start) : b.date.localeCompare(a.date)));
  const showForm = !fitbitConnected || manualOpen;

  useEffect(() => {
    if (!devicesConfigured()) return;
    let cancel = false;
    deviceStatus()
      .then((links) => {
        if (!cancel) setFitbitConnected(links.fitbit);
      })
      .catch(() => {
        if (!cancel) setFitbitConnected(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  function saveRun() {
    const miles = Number(distance);
    const duration = Number(minutes);
    const heart = hr.trim() ? Number(hr) : undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(miles) || miles <= 0 || !Number.isFinite(duration) || duration <= 0) {
      setMessage("Add a date, a distance, and minutes.");
      return;
    }
    if (heart !== undefined && (!Number.isFinite(heart) || heart <= 0)) {
      setMessage("Heart rate should be a number, or leave it blank.");
      return;
    }
    const run: RunLog = {
      id: `manual:${date}:${start}:${crypto.randomUUID()}`,
      date,
      start,
      distanceMi: miles,
      durationMin: duration,
      kind,
      source: "manual",
      avgHr: heart,
    };
    upsertRun(run);
    setDistance("");
    setMinutes("");
    setHr("");
    setMessage("Saved. A hand entry is kept ahead of a Fitbit duplicate.");
  }

  const cleared = new Map<number, number>();
  for (const attempt of status.attempts) {
    if (attempt.met) cleared.set(attempt.ladderWeek, attempt.miles);
  }

  const logList = (
    <section className="card stack">
      <h2>{fitbitConnected ? "Runs from Fitbit" : "Recent runs and walks"}</h2>
      {fitbitConnected ? <p className="note">These are the synced runs and walks. A typed entry only fills a gap.</p> : null}
      {runs.length === 0 ? (
        <p className="note">{fitbitConnected ? "None yet. They show up here after Fitbit syncs." : "None yet. Save an evening above, or sync Fitbit from Progress."}</p>
      ) : null}
      <ul className="history">
        {runs.slice(0, 30).map((run) => {
          const evening = eveningForDate(plan, run.date);
          const pace = paceSeconds(run);
          const high = easyHrHigh(run, evening.kind);
          const zones = zoneLine(run);
          return (
            <li key={run.id}>
              <div>
                <strong>
                  {formatPretty(run.date)}
                  {run.start ? ` · ${run.start}` : ""} · {evening.kind === "hard" ? "Hard run" : "Easy walk"}
                </strong>
                <p className="note">
                  {formatMiles(run.distanceMi)} mi · {formatDuration(run.durationMin)}
                  {pace ? ` · ${formatPace(pace)}` : ""}
                  {run.avgHr ? ` · avg HR ${Math.round(run.avgHr)} bpm` : " · no heart rate"}
                  {run.source === "fitbit" ? " · Fitbit" : " · typed"}
                </p>
                {run.calories || run.steps || run.elevationFt ? (
                  <p className="note">
                    {[
                      run.calories ? `${Math.round(run.calories)} cal` : "",
                      run.steps ? `${Math.round(run.steps).toLocaleString()} steps` : "",
                      run.elevationFt ? `${Math.round(run.elevationFt)} ft up` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                {zones ? <p className="note">{zones}</p> : null}
                {evening.kind !== "hard" ? <p className="note">Target: keep avg HR under ~{EASY_HR_LIMIT} bpm.</p> : null}
                {high ? <p className="hr-flag">Easy session went over ~{EASY_HR_LIMIT} bpm.</p> : null}
              </div>
              {run.source === "manual" ? (
                <button type="button" className="text-btn" onClick={() => removeRun(run.id)}>
                  Remove
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );

  return (
    <div className="stack-lg">
      <div>
        <h1>Running</h1>
        <p className="lede">
          Road to 5 miles. Evenings start near 2 miles and about 14 miles a week, and grow by at most 10% a week toward 5-mile evenings and about 35 miles a week. Every 4th week is about 20% lighter. Easy nights are walks. Hard nights add jogging, first as run/walk intervals, then as a continuous block of up to 3 miles.
        </p>
      </div>

      <section className="card stack">
        <h2>
          Week {status.step.week}
          {status.step.recovery ? " · recovery" : ""}
          {status.repeating ? " · repeating" : ""}
        </h2>
        <p className="metric-value">
          {formatMiles(status.loggedThisWeek)} / {formatMiles(status.step.weeklyMiles)} mi
        </p>
        <p className="note">
          Easy nights: {formatMiles(status.step.sessionMiles)} mi walk. Hard nights: {formatMiles(status.step.sessionMiles)} mi with {formatMiles(status.step.hardRunMiles)} mi{" "}
          {status.step.hardStyle === "intervals" ? "of run/walk intervals" : "continuous jog"}.
        </p>
        {status.repeating ? <p className="note">Last week missed the target by a lot, so this ladder week repeats instead of moving on.</p> : null}
        <p className="note">The night before a leg day, and the evening of a leg day, stay an easy walk with no running. A finished week moves on when logged miles reach 80% of the target.</p>
      </section>

      <section className="card stack">
        <h2>This week’s evenings</h2>
        <ul className="ladder">
          {schedule.map((evening, index) => {
            const iso = index === new Date().getDay() ? today : "";
            return (
              <li key={weekdayLabel(index)} className={iso ? "current" : undefined}>
                <span>
                  <strong>{weekdayLabel(index)}</strong>
                  <br />
                  {evening.kind === "hard" ? "Hard run" : "Easy walk"}
                  {evening.note ? ` · ${evening.note}` : ""}
                </span>
                <span>
                  {evening.kind === "hard"
                    ? `${formatMiles(status.step.sessionMiles)} mi · ${formatMiles(status.step.hardRunMiles)} running`
                    : `${formatMiles(status.step.sessionMiles)} mi walk`}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="note">Easy nights: keep average heart rate under about {EASY_HR_LIMIT} bpm. A session over that is flagged in the list.</p>
      </section>

      <section className="card stack">
        <h2>Ladder</h2>
        <ul className="ladder">
          {status.ladder.map((step, index) => {
            const logged = index === status.index ? status.loggedThisWeek : cleared.get(step.week);
            const missed = status.attempts.some((attempt) => attempt.ladderWeek === step.week && !attempt.met);
            return (
              <li key={step.week} className={index === status.index ? "current" : undefined}>
                <span>
                  <strong>
                    Week {step.week}
                    {step.recovery ? " · lighter" : ""}
                    {index === status.index ? " · now" : ""}
                  </strong>
                  <br />
                  <span className="note">
                    {formatMiles(step.sessionMiles)} mi evenings
                    {missed ? " · repeated after a short week" : ""}
                  </span>
                </span>
                <span>
                  {logged === undefined ? "—" : formatMiles(logged)} / {formatMiles(step.weeklyMiles)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {fitbitConnected ? logList : null}
      {fitbitConnected && !showForm ? (
        <button type="button" className="link-quiet" onClick={() => setManualOpen(true)}>
          Add a run manually
        </button>
      ) : null}
      {showForm ? (
        <section className="card stack">
          <h2>Log an evening</h2>
          <p className="note">
            {fitbitConnected
              ? "Use this if a Fitbit run did not sync, or the weekly Google sign-in lapsed. A hand entry with a similar start time wins."
              : devicesConfigured()
                ? "Fitbit Run and Walk entries fill in after a sync. A hand entry with a similar start time wins."
                : "No sync service is set up, so this list is what you type in. Connect Fitbit later and those runs join the same log."}
          </p>
          <Field label="Date" type="date" value={date} onChange={setDate} />
          <Field label="Start" type="time" value={start} onChange={setStart} />
          <div className="grid-2">
            <Field label="Miles" type="text" inputMode="decimal" value={distance} onChange={setDistance} />
            <Field label="Minutes" type="text" inputMode="decimal" value={minutes} onChange={setMinutes} />
          </div>
          <SelectField
            label="Type"
            value={kind}
            onChange={(value) => setKind(value === "walk" ? "walk" : "run")}
            options={[
              { value: "walk", label: "Walk" },
              { value: "run", label: "Run" },
            ]}
          />
          <Field label="Average heart rate" type="text" inputMode="numeric" value={hr} onChange={setHr} hint="Optional. Easy nights aim under about 145 bpm." />
          <button type="button" className="btn primary" onClick={saveRun}>
            Save evening
          </button>
          {message ? <p className="note">{message}</p> : null}
        </section>
      ) : null}
      {fitbitConnected ? null : logList}

      <section className="card stack">
        <h2>Weekly miles</h2>
        <p className="note">Bars are logged miles. The dark tick is that week’s ladder target.</p>
        <MilesChart rows={series} />
      </section>

      <section className="card stack">
        <h2>Pace</h2>
        <PaceChart rows={series} />
      </section>

      <section className="card stack">
        <h2>Average heart rate</h2>
        <HrChart rows={series.map((row) => ({ weekStart: row.weekStart, hr: row.hr }))} label="Weekly average heart rate" />
      </section>

      <section className="card stack">
        <h2>Aerobic fitness</h2>
        <p className="note">
          Average heart rate at a similar pace
          {fitness ? ` (${fitness.bucket.label})` : ""}. {fitness ? fitnessNote(fitness.points) : "A falling line means fitness is improving: the same pace takes less heart rate."}
        </p>
        <HrChart
          rows={(fitness?.points ?? []).map((point) => ({ weekStart: point.weekStart, hr: point.hr }))}
          label="Heart rate at a similar pace"
        />
      </section>
    </div>
  );
}
