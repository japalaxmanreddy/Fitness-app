import { useEffect, useState } from "react";
import { Demo } from "../demo";
import { GROUPS, LIB, exercisesIn, type Group } from "../data";
import { animFor } from "../motion";
import { takeExerciseRequest } from "../nav";
import { useStore } from "../store";
import { SessionLogger } from "../session";
import { HowTo } from "../youtube";
import { PropList, Segmented, SelectField } from "../ui";

export function Exercises() {
  const { data } = useStore();
  const [group, setGroup] = useState<Group>("All");
  const [selected, setSelected] = useState(LIB[0].name);
  const library = exercisesIn(group);
  const current = library.find((exercise) => exercise.name === selected) ?? library[0];

  useEffect(() => {
    const apply = () => {
      const name = takeExerciseRequest();
      if (!name) return;
      const exercise = LIB.find((item) => item.name === name);
      if (!exercise) return;
      setGroup("All");
      setSelected(exercise.name);
      window.scrollTo(0, 0);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  function changeGroup(next: Group) {
    setGroup(next);
    const list = exercisesIn(next);
    if (!list.some((exercise) => exercise.name === selected)) setSelected(list[0]?.name ?? "");
  }

  if (!current) return null;

  return (
    <div className="stack-lg">
      <div>
        <h1>Exercises</h1>
        <p className="lede">Every move in the plan, with the cue and a left-forearm note.</p>
      </div>
      <Segmented
        label="Muscle group"
        value={group}
        onChange={changeGroup}
        options={GROUPS.map((item) => ({ value: item, label: item }))}
      />
      <SelectField label="Exercise" value={current.name} onChange={setSelected} options={library.map((exercise) => exercise.name)} />
      <Demo anim={animFor(current.name)} label={current.name} />
      <section className="card">
        <PropList
          items={[
            { label: "Works", value: current.muscles },
            { label: "How to", value: current.cue },
            { label: "Left forearm", value: current.arm },
          ]}
        />
      </section>
      <HowTo url={current.videoUrl} title={current.name} />
      <section className="card stack">
        <h2>Log this exercise</h2>
        <SessionLogger
          key={current.name}
          label={current.name}
          phase={data.profile.phase}
          days={data.profile.days}
          rows={[[current.name, ""]]}
          showDemo={false}
          idFor={(date) => `${date}|library|${current.name}`}
        />
      </section>
    </div>
  );
}
