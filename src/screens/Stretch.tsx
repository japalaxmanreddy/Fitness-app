import { useState } from "react";
import { Demo } from "../demo";
import { STRETCHES } from "../data";
import { animFor } from "../motion";
import { HowTo } from "../youtube";
import { PropList, SelectField } from "../ui";

export function Stretch() {
  const [name, setName] = useState(STRETCHES[0].name);
  const current = STRETCHES.find((stretch) => stretch.name === name) ?? STRETCHES[0];

  return (
    <div className="stack-lg">
      <div>
        <h1>Stretch</h1>
        <p className="lede">Do the full routine after every workout and on bike days, about 10 minutes.</p>
      </div>
      <SelectField label="Stretch" value={current.name} onChange={setName} options={STRETCHES.map((stretch) => stretch.name)} />
      <Demo anim={animFor(current.name)} label={current.name} />
      <section className="card">
        <PropList
          items={[
            { label: "Hold", value: current.hold },
            { label: "How to", value: current.cue },
          ]}
        />
      </section>
      <HowTo url={current.videoUrl} title={current.name} />
      <section className="card">
        <h2>Full routine</h2>
        <div className="pick-list">
          {STRETCHES.map((stretch) => (
            <button
              key={stretch.name}
              type="button"
              className={stretch.name === current.name ? "pick on" : "pick"}
              onClick={() => {
                setName(stretch.name);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span>{stretch.name}</span>
              <span>{stretch.hold}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
