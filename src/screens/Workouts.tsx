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
import { workoutRows } from "../day-plan";
import { DayBody } from "../day-view";
import { workoutHasData } from "../log";
import { useStore } from "../store";
import type { Phase, PlanDays } from "../storage";
import { SessionLogger } from "../session";
import { Callout, NumberedList, Segmented, Steps } from "../ui";

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
            Warm-up, workout, cool-down, and movement breaks{logged ? " · logged today" : ""}
          </span>
        </span>
      </summary>
      <div className="body">
        <DayBody
          day={day}
          log={
            <SessionLogger
              label={day.day}
              phase={phase}
              days={days}
              rows={workoutRows(day)}
              idFor={(date) => `${date}|${phase}|${day.day}`}
            />
          }
        />
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
      <p className="note">Each lifting session takes about 45 to 55 minutes, including the warm-up and cool-down. Open a move for the animation, the cues, and the how-to video. The Exercises tab is still there as the full library.</p>

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
