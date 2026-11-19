import { useEffect, useRef } from "react";
import { todayISO } from "../dates";
import {
  FOREARM_RULES,
  PROGRESS_STEPS,
  WARMUP,
  planFor,
  suggestedDay,
  type PlanDay,
} from "../data";
import { workoutHasData } from "../log";
import { useStore } from "../store";
import type { Phase, PlanDays } from "../storage";
import { SessionLogger } from "../session";
import { Callout, NumberedList, Segmented, SimpleTable, Steps } from "../ui";

function DayCard({
  day,
  phase,
  days,
  initiallyOpen,
  logged,
}: {
  day: PlanDay;
  phase: Phase;
  days: PlanDays;
  initiallyOpen: boolean;
  logged: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.open = initiallyOpen;
  }, [initiallyOpen]);

  return (
    <details className="day" ref={ref}>
      <summary>
        <span>
          <span className="sum-title">{day.day}</span>
          <span className="sum-meta">
            {day.rows.length} moves{logged ? " · logged today" : ""}
          </span>
        </span>
      </summary>
      <div className="body stack">
        <SimpleTable columns={["Exercise", "Sets x reps"]} rows={day.rows} />
        <details className="log">
          <summary>Log sets, reps, and weight</summary>
          <SessionLogger
            label={day.day}
            phase={phase}
            days={days}
            rows={day.rows}
            idFor={(date) => `${date}|${phase}|${day.day}`}
          />
        </details>
      </div>
    </details>
  );
}

export function Workouts() {
  const { data, setProfile } = useStore();
  const { profile } = data;
  const plan = planFor(profile.phase, profile.days);
  const suggested = suggestedDay(plan);
  const today = todayISO();

  return (
    <div className="stack-lg">
      <div>
        <h1>Workouts</h1>
        <p className="lede">Phase 1 is home for weeks 1 to 4. Phase 2 moves the heavy work to machines and cables.</p>
      </div>
      <Segmented
        label="Training phase"
        columns
        value={profile.phase}
        onChange={(phase) => setProfile({ phase })}
        options={[
          { value: "home", label: "Phase 1: Home, weeks 1-4" },
          { value: "gym", label: "Phase 2: Gym, week 5 on" },
        ]}
      />
      {profile.phase === "home" ? (
        <Segmented
          label="Days each week"
          value={profile.days}
          onChange={(days) => setProfile({ days })}
          options={[
            { value: "5", label: "5 days" },
            { value: "4", label: "4 days" },
            { value: "3", label: "3 days" },
          ]}
        />
      ) : (
        <p className="note">Machines and cables take over where the 35 lb dumbbells run out and take load off your grip. Bring wrist straps for heavy pulls.</p>
      )}

      <div className="stack" key={`${profile.phase}-${profile.days}`}>
        {plan.map((day) => {
          const id = `${today}|${profile.phase}|${day.day}`;
          const logged = data.workouts.some((workout) => workout.id === id && workoutHasData(workout));
          return (
            <DayCard
              key={day.day}
              day={day}
              phase={profile.phase}
              days={profile.days}
              initiallyOpen={day.day === suggested?.day}
              logged={logged}
            />
          );
        })}
      </div>
      <p className="note">Each session takes about 45 to 55 minutes, including warm-up. Rest 60 to 90 seconds between sets. Watch any move in the Exercises tab.</p>

      <details className="guide">
        <summary>How to progress</summary>
        <div className="body">
          <Steps steps={PROGRESS_STEPS} />
        </div>
      </details>

      <details className="guide">
        <summary>Left forearm safety</summary>
        <div className="body stack">
          <Callout>
            Your plates are 12 years healed, but the left arm has been out of lifting for a while. Stop any set that gives sharp or deep pain near the plates, and ask your doctor or a physical therapist if it lasts beyond a day.
          </Callout>
          <NumberedList items={FOREARM_RULES} />
        </div>
      </details>

      <details className="guide">
        <summary>Warm-up before every workout</summary>
        <div className="body">
          <Steps steps={WARMUP} />
        </div>
      </details>
    </div>
  );
}
