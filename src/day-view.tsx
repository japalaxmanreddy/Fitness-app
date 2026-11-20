import { useEffect, useRef, useState, type ReactNode } from "react";
import { FOREARM_PLATE_NOTE, dayOutline, type DayMove } from "./day-plan";
import { Demo } from "./demo";
import { planFor, type PlanDay } from "./data";
import { diffDays, todayISO } from "./dates";
import { animFor } from "./motion";
import { eveningCopy } from "./runs";
import { useStore } from "./store";
import { HowTo } from "./youtube";

export function MoveCard({ move, initiallyOpen = false }: { move: DayMove; initiallyOpen?: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(initiallyOpen);
  useEffect(() => {
    if (!initiallyOpen || !ref.current) return;
    ref.current.open = true;
    setOpen(true);
    ref.current.scrollIntoView({ block: "start" });
  }, [initiallyOpen]);
  return (
    <details
      className="move"
      ref={ref}
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <span>
          <span className="sum-title">{move.name}</span>
          <span className="sum-meta">{move.prescription}</span>
        </span>
      </summary>
      {open ? (
        <div className="body stack">
          <Demo anim={animFor(move.name)} label={move.name} />
          <p>{move.cue}</p>
          {move.forearm ? <p className="plate-note">{move.forearmNote || FOREARM_PLATE_NOTE}</p> : null}
          {move.videoUrl ? <HowTo url={move.videoUrl} title={move.name} site={move.videoSite} /> : null}
        </div>
      ) : null}
    </details>
  );
}

function Block({ title, note, moves }: { title: string; note: string; moves: DayMove[] }) {
  return (
    <section className="day-block">
      <h3 className="block-label">{title}</h3>
      <p className="note">{note}</p>
      {moves.map((move) => (
        <MoveCard key={move.name} move={move} />
      ))}
    </section>
  );
}

export function DayBody({ day, log }: { day: PlanDay; log: ReactNode }) {
  const { data } = useStore();
  const plan = planFor(data.profile.phase, data.profile.days);
  const week = Math.max(0, Math.floor(diffDays(data.profile.planStart, todayISO()) / 7));
  const outline = dayOutline(day, { week, phase: data.profile.phase, siblings: plan });
  const snacks = outline.snacks.map((move) => (move.name.startsWith("Evening") ? eveningCopy(plan, day, data.runs, todayISO()) : move));
  return (
    <div className="stack">
      <Block
        title="Warm-up"
        note="5–8 minutes, easy and dynamic, before the first work set."
        moves={outline.warmup}
      />
      <Block
        title="Workout"
        note="Rest 60 to 90 seconds between sets."
        moves={outline.workout}
      />
      <details className="log">
        <summary>Log sets, reps, and weight</summary>
        {log}
      </details>
      {outline.abs.length ? <Block title="Abs & core" note={outline.absNote} moves={outline.abs} /> : null}
      <Block
        title="Cool-down"
        note="About 5 minutes on the muscles you just trained."
        moves={outline.cooldown}
      />
      <Block
        title="Throughout the day"
        note="Two or three easy breaks. The strength ones are about half of a max set."
        moves={snacks}
      />
    </div>
  );
}
