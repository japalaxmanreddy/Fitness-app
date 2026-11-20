import { formatPretty } from "./dates";
import { formatPace } from "./runs";

type Point = { label: string; value: number | null };

function LineChart({ points, label, format }: { points: Point[]; label: string; format: (value: number) => string }) {
  const drawn = points.filter((point): point is { label: string; value: number } => point.value !== null);
  if (drawn.length < 2) return <p className="note">Log a few weeks to see this trend.</p>;
  const width = 360;
  const height = 140;
  const left = 42;
  const right = 10;
  const top = 12;
  const bottom = 22;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const values = drawn.map((point) => point.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  const x = (index: number) => left + (points.length <= 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
  const y = (value: number) => top + ((max - value) / span) * plotH;
  let started = false;
  const d = points
    .map((point, index) => {
      if (point.value === null) {
        started = false;
        return "";
      }
      const command = started ? "L" : "M";
      started = true;
      return `${command}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" />
      {points.map((point, index) =>
        point.value === null ? null : (
          <circle key={point.label} cx={x(index)} cy={y(point.value)} r="3" fill="var(--accent)">
            <title>
              {point.label}: {format(point.value)}
            </title>
          </circle>
        ),
      )}
      <text x={left} y={height - 6} fill="var(--muted)" fontSize="10">
        {points[0]?.label}
      </text>
      <text x={width - right} y={height - 6} textAnchor="end" fill="var(--muted)" fontSize="10">
        {points[points.length - 1]?.label}
      </text>
      <text x={4} y={top + 8} fill="var(--muted)" fontSize="10">
        {format(max)}
      </text>
    </svg>
  );
}

export function MilesChart({ rows }: { rows: { weekStart: string; miles: number; target: number }[] }) {
  if (rows.length === 0) return <p className="note">Logged miles show up here next to each week's target.</p>;
  const width = 360;
  const height = 150;
  const left = 8;
  const bottom = 22;
  const top = 12;
  const plotH = height - top - bottom;
  const gap = 8;
  const barW = (width - left * 2 - gap * (rows.length - 1)) / rows.length;
  const max = Math.max(1, ...rows.map((row) => Math.max(row.miles, row.target)));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Weekly miles compared with the ladder target.">
      {rows.map((row, index) => {
        const x = left + index * (barW + gap);
        const logged = (row.miles / max) * plotH;
        const targetY = top + plotH - (row.target / max) * plotH;
        return (
          <g key={row.weekStart}>
            <rect x={x} y={top + plotH - logged} width={barW} height={Math.max(logged, row.miles ? 2 : 1)} rx="3" fill="var(--accent)">
              <title>
                {formatPretty(row.weekStart)}: {row.miles.toFixed(1)} of {row.target.toFixed(1)} mi
              </title>
            </rect>
            <line x1={x} x2={x + barW} y1={targetY} y2={targetY} stroke="var(--ink)" strokeWidth="2" />
            <text x={x + barW / 2} y={height - 6} textAnchor="middle" fill="var(--muted)" fontSize="9">
              {formatPretty(row.weekStart).replace(/^[A-Za-z]+ /, "")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function PaceChart({ rows }: { rows: { weekStart: string; pace: number | null }[] }) {
  return (
    <LineChart
      label="Weekly average pace"
      points={rows.map((row) => ({ label: formatPretty(row.weekStart), value: row.pace }))}
      format={formatPace}
    />
  );
}

export function HrChart({ rows, label }: { rows: { weekStart: string; hr: number | null }[]; label: string }) {
  return (
    <LineChart
      label={label}
      points={rows.map((row) => ({ label: formatPretty(row.weekStart), value: row.hr }))}
      format={(value) => `${Math.round(value)} bpm`}
    />
  );
}
