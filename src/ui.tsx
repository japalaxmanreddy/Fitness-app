import type { ReactNode } from "react";
import type { SetLog } from "./storage";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date";
  inputMode?: "decimal" | "numeric";
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "any" : undefined}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => event.currentTarget.scrollIntoView({ block: "center" })}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[] | string[];
}) {
  const items = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {items.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  columns,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  columns?: boolean;
}) {
  return (
    <div className={columns ? "seg seg-col" : "seg"} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Metric({
  value,
  label,
  detail,
  hero,
}: {
  value: string;
  label: string;
  detail?: string;
  hero?: boolean;
}) {
  return (
    <article className={hero ? "metric hero" : "metric"}>
      <p className={value.length > 10 ? "metric-value compact" : "metric-value"}>{value}</p>
      <p className="metric-label">{label}</p>
      {detail ? <p className="metric-detail">{detail}</p> : null}
    </article>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="callout" role="note">
      {children}
    </div>
  );
}

export function Steps({ steps }: { steps: { title: string; detail: string }[] }) {
  return (
    <ol className="steps">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span className="num">{index + 1}</span>
          <div>
            <strong>{step.title}</strong>
            <p className="note">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="numbered">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

export function PropList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="props">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SimpleTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row[0]}-${index}`}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SetEditor({ sets, onChange }: { sets: SetLog[]; onChange: (sets: SetLog[]) => void }) {
  return (
    <div className="sets">
      <div className="set-head">
        <span />
        <span>Weight</span>
        <span>Reps / time</span>
        <span />
      </div>
      {sets.map((set, index) => (
        <div className="set-row" key={index}>
          <span className="set-n">{index + 1}</span>
          <input
            inputMode="decimal"
            aria-label={`Set ${index + 1} weight in pounds`}
            placeholder="lb"
            value={set.weight}
            autoComplete="off"
            onChange={(event) => onChange(sets.map((item, itemIndex) => (itemIndex === index ? { ...item, weight: event.target.value } : item)))}
            onFocus={(event) => event.currentTarget.scrollIntoView({ block: "center" })}
          />
          <input
            inputMode="decimal"
            aria-label={`Set ${index + 1} reps or time`}
            placeholder="reps"
            value={set.reps}
            autoComplete="off"
            onChange={(event) => onChange(sets.map((item, itemIndex) => (itemIndex === index ? { ...item, reps: event.target.value } : item)))}
            onFocus={(event) => event.currentTarget.scrollIntoView({ block: "center" })}
          />
          <button
            type="button"
            className="icon-x"
            aria-label={`Remove set ${index + 1}`}
            onClick={() => onChange(sets.filter((_, itemIndex) => itemIndex !== index))}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...sets, { weight: "", reps: "" }])}>
        Add set
      </button>
    </div>
  );
}

export function Icon({ name }: { name: "today" | "workouts" | "exercises" | "stretch" | "progress" | "sun" | "moon" }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "today") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8.5V12l2.2 1.6" />
      </svg>
    );
  }
  if (name === "workouts") {
    return (
      <svg {...props}>
        <path d="M6 8h12M6 12h12M6 16h8" />
      </svg>
    );
  }
  if (name === "exercises") {
    return (
      <svg {...props}>
        <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
        <path d="M12 7.2v5.2M8.2 10.2h7.6M12 12.4l-2.4 6M12 12.4l2.4 6" />
      </svg>
    );
  }
  if (name === "stretch") {
    return (
      <svg {...props}>
        <circle cx="8" cy="6" r="1.6" fill="currentColor" stroke="none" />
        <path d="M8 8.2v4.2l6 2.2M8 10.5h5.5M8 12.4l-1.5 6M8 12.4l3 5.6" />
      </svg>
    );
  }
  if (name === "progress") {
    return (
      <svg {...props}>
        <path d="M4 16.5l5-5 3.2 3.2L20 6.5" />
        <path d="M14.5 6.5H20V12" />
      </svg>
    );
  }
  if (name === "sun") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8M6 6l1.3 1.3M16.7 16.7 18 18M18 6l-1.3 1.3M7.3 16.7 6 18" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M16.5 14.2A6.2 6.2 0 0 1 9.8 4.6 6.4 6.4 0 1 0 16.5 14.2z" />
    </svg>
  );
}
