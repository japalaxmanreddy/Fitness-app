import { useState } from "react";
import { energyNeeds, inchesToFeet, proteinGrams } from "../calc";
import { todayISO } from "../dates";
import { PROTEIN_FOODS, planFor, suggestedDay } from "../data";
import { goTo } from "../nav";
import { useStore } from "../store";
import { Field, Metric, PropList, SelectField } from "../ui";

function cleanNumber(value: string): string | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return "";
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  return trimmed;
}

export function Today() {
  const { data, setProfile, upsertCheckin, removeCheckin } = useStore();
  const { profile } = data;
  const energy = energyNeeds(profile);
  const protein = proteinGrams(profile.weight);
  const heightHint = inchesToFeet(profile.height);
  const [date, setDate] = useState(todayISO);
  const existing = data.checkins.find((item) => item.date === date);
  const [weight, setWeight] = useState(existing?.weight ?? "");
  const [steps, setSteps] = useState(existing?.steps ?? "");
  const [calories, setCalories] = useState(existing?.calories ?? "");
  const [message, setMessage] = useState("");
  const plan = planFor(profile.phase, profile.days);
  const todayPlan = suggestedDay(plan);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);

  function loadDate(iso: string) {
    const row = data.checkins.find((item) => item.date === iso);
    setDate(iso);
    setWeight(row?.weight ?? "");
    setSteps(row?.steps ?? "");
    setCalories(row?.calories ?? "");
    setMessage("");
  }

  function saveDay() {
    const nextWeight = cleanNumber(weight);
    const nextSteps = cleanNumber(steps);
    const nextCalories = cleanNumber(calories);
    if (nextWeight === null || nextSteps === null || nextCalories === null) {
      setMessage("Use numbers only. Commas are fine.");
      return;
    }
    if (!nextWeight && !nextSteps && !nextCalories) {
      removeCheckin(date);
      setMessage("Cleared that day.");
      return;
    }
    upsertCheckin({
      ...existing,
      date,
      weight: nextWeight,
      steps: nextSteps,
      calories: nextCalories,
      weightSource: nextWeight ? "manual" : undefined,
      stepsSource: nextSteps ? "manual" : undefined,
      caloriesSource: nextCalories ? "manual" : undefined,
    });
    setWeight(nextWeight);
    setSteps(nextSteps);
    setCalories(nextCalories);
    setMessage("Saved on this phone.");
  }

  return (
    <div className="stack-lg">
      <div>
        <h1>Today</h1>
        <p className="lede">
          Your home plan to drop from 195 to 174-180 lb while building muscle, with animated how-to demos for every exercise and stretch and left-forearm-safe choices built in.
        </p>
      </div>

      <section className="card stack">
        <h2>Your daily targets</h2>
        <div className="grid-2">
          <Field label="Weight (lb)" type="number" inputMode="decimal" value={profile.weight} onChange={(value) => setProfile({ weight: value })} />
          <Field
            label="Height (inches)"
            type="number"
            inputMode="decimal"
            value={profile.height}
            hint={heightHint || undefined}
            onChange={(value) => setProfile({ height: value })}
          />
          <Field label="Age" type="number" inputMode="numeric" value={profile.age} onChange={(value) => setProfile({ age: value })} />
          <SelectField
            label="Sex"
            value={profile.sex}
            onChange={(value) => setProfile({ sex: value === "female" ? "female" : "male" })}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          <div className="span-2">
            <SelectField
              label="Day outside workouts"
              value={profile.activity}
              onChange={(value) => setProfile({ activity: value === "mixed" || value === "feet" ? value : "desk" })}
              options={[
                { value: "desk", label: "Mostly sitting" },
                { value: "mixed", label: "Mix of sitting and moving" },
                { value: "feet", label: "On my feet most of the day" },
              ]}
            />
          </div>
        </div>
        <div className="metrics">
          {energy ? (
            <>
              <Metric hero value={energy.target.toLocaleString()} label="Calories a day to lose" detail="About 1 lb a week" />
              <Metric value={energy.maint.toLocaleString()} label="Maintenance calories" detail="Estimate" />
            </>
          ) : null}
          <Metric value={`${protein.protein} g`} label="Protein a day" detail={`Range ${protein.low}-${protein.high} g`} />
          <Metric value="8,000-10,000" label="Steps a day" />
        </div>
        <p className="note">
          Start around 2,000 calories a day. The calculator uses the Mifflin-St Jeor estimate minus 500. If your weight hasn't dropped after 2 to 3 weeks, cut another 150 to 200. Don't eat back the calories your band says you burned.
        </p>
      </section>

      <section className="card stack">
        <h2>Today's check-in</h2>
        <p className="note">Morning weight, plus steps and calories burned typed in from Fitbit.</p>
        <Field label="Date" type="date" value={date} onChange={loadDate} />
        <div className="grid-2">
          <Field label="Weight (lb)" type="text" inputMode="decimal" value={weight} onChange={setWeight} />
          <Field label="Steps" type="text" inputMode="numeric" value={steps} onChange={setSteps} />
          <div className="span-2">
            <Field label="Calories burned" type="text" inputMode="numeric" value={calories} onChange={setCalories} />
          </div>
        </div>
        <div className="row-actions">
          <button type="button" className="btn primary" onClick={saveDay}>
            Save day
          </button>
          {cleanNumber(weight) ? (
            <button type="button" className="btn" onClick={() => setProfile({ weight: cleanNumber(weight) || profile.weight })}>
              Use weight for targets
            </button>
          ) : null}
        </div>
        {message ? <p className="note">{message}</p> : null}
      </section>

      {todayPlan ? (
        <section className="card stack">
        <h2>On the plan today</h2>
        <p className="note">{todayPlan.day}</p>
          <ul className="plain">
            {todayPlan.rows.slice(0, 4).map((row) => (
              <li key={row[0]}>
                <span>{row[0]}</span>
                <span>{row[1]}</span>
              </li>
            ))}
          </ul>
          {todayPlan.rows.length > 4 ? <p className="note">+ {todayPlan.rows.length - 4} more</p> : null}
          <button type="button" className="btn" onClick={() => goTo("workouts")}>
            Open workout
          </button>
        </section>
      ) : null}

      <section className="card stack">
        <h2>Protein made easy</h2>
        <PropList items={PROTEIN_FOODS} />
      </section>

      {!standalone && !profile.dismissedInstall ? (
        <section className="card stack">
          <h2>Add to Home Screen</h2>
          <p className="note">
            On iPhone, open this page in Safari, tap Share, then Add to Home Screen. The icon opens full screen, with no Safari bar, and works offline after the first visit.
          </p>
          <button type="button" className="btn" onClick={() => setProfile({ dismissedInstall: true })}>
            Hide this
          </button>
        </section>
      ) : null}
    </div>
  );
}
