import { addDays, diffDays, formatPretty, parseISODate } from "./dates";
import { planWeight } from "./data";
import type { CheckIn } from "./storage";

export function WeightChart({ planStart, checkins }: { planStart: string; checkins: CheckIn[] }) {
  const actual = checkins
    .map((item) => ({
      date: item.date,
      lb: Number(item.weight),
      week: diffDays(planStart, item.date) / 7,
    }))
    .filter((point) => Number.isFinite(point.lb) && point.lb > 0)
    .sort((a, b) => a.week - b.week);

  let minWeek = 0;
  let maxWeek = 18;
  let floor = 174;
  let ceiling = 197;
  for (const point of actual) {
    minWeek = Math.min(minWeek, Math.floor(point.week));
    maxWeek = Math.max(maxWeek, Math.ceil(point.week));
    if (point.lb < floor) floor = Math.floor(point.lb) - 2;
    if (point.lb > ceiling) ceiling = Math.ceil(point.lb) + 2;
  }

  const width = 360;
  const height = 220;
  const left = 38;
  const right = 18;
  const top = 16;
  const bottom = 28;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const span = maxWeek - minWeek || 1;
  const x = (week: number) => left + ((week - minWeek) / span) * plotW;
  const y = (lb: number) => top + ((ceiling - lb) / (ceiling - floor || 1)) * plotH;
  const plan = Array.from({ length: 19 }, (_, week) => week);
  const planPath = plan
    .map((week, index) => `${index === 0 ? "M" : "L"}${x(week).toFixed(1)},${y(planWeight(week)).toFixed(1)}`)
    .join(" ");
  const actualPath =
    actual.length > 1
      ? actual.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.week).toFixed(1)},${y(point.lb).toFixed(1)}`).join(" ")
      : "";
  const ticks = [195, 186, 177].filter((value) => value >= floor && value <= ceiling);
  if (ticks.length === 0) {
    for (let value = Math.ceil(floor / 6) * 6; value <= ceiling; value += 6) ticks.push(value);
  }
  const xLabels = [0, 4, 8, 12, 16].filter((week) => week >= minWeek && week <= maxWeek);
  const summary = `Planned weight from 195 pounds in week 0 to 177 pounds in week 18. ${actual.length} weigh-in${actual.length === 1 ? "" : "s"} logged.`;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={summary}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="var(--line)" />
            <text x={left - 6} y={y(tick) + 3} textAnchor="end" fill="var(--muted)" fontSize="10">
              {tick}
            </text>
          </g>
        ))}
        <path d={planPath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
        {actualPath ? <path d={actualPath} fill="none" stroke="var(--good)" strokeWidth="2.25" strokeLinejoin="round" /> : null}
        {actual.map((point) => (
          <circle key={point.date} cx={x(point.week)} cy={y(point.lb)} r="3.6" fill="var(--good)">
            <title>
              {formatPretty(point.date)}: {point.lb} lb
            </title>
          </circle>
        ))}
        <text x={Math.max(left + 36, x(18) - 6)} y={Math.max(12, y(177) - 7)} textAnchor="end" fill="var(--accent)" fontSize="11" fontWeight={700}>
          177 lb
        </text>
        {xLabels.map((week) => {
          const px = x(week);
          const anchor = px < left + 20 ? "start" : "middle";
          return (
            <text key={week} x={px} y={height - 8} textAnchor={anchor} fill="var(--muted)" fontSize="10">
              Wk {week}
            </text>
          );
        })}
      </svg>
      <div className="legend">
        <span>
          <i className="swatch plan" /> Planned weight
        </span>
        <span>
          <i className="swatch logged" /> Logged weigh-ins
        </span>
      </div>
      <p className="note">Week 18 lands on {formatPretty(addDays(planStart, 18 * 7))}.</p>
    </div>
  );
}

export function StepsChart({ checkins, today }: { checkins: CheckIn[]; today: string }) {
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index - 13);
    const row = checkins.find((item) => item.date === date);
    const steps = Number(row?.steps);
    return { date, steps: Number.isFinite(steps) && steps > 0 ? steps : 0 };
  });
  const max = Math.max(10000, ...days.map((day) => day.steps), 1);
  const width = 360;
  const height = 128;
  const left = 6;
  const bottom = 18;
  const top = 10;
  const plotH = height - top - bottom;
  const gap = 5;
  const barW = (width - left * 2 - gap * 13) / 14;
  const goalY = top + (1 - Math.min(8000, max) / max) * plotH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Steps for the last 14 days, with a goal line at 8,000.">
      <line x1={left} x2={width - left} y1={goalY} y2={goalY} stroke="var(--accent)" strokeDasharray="3 3" />
      {days.map((day, index) => {
        const bar = (day.steps / max) * plotH;
        const x = left + index * (barW + gap);
        return (
          <g key={day.date}>
            <rect
              x={x}
              y={top + plotH - bar}
              width={barW}
              height={day.steps ? Math.max(bar, 2) : 2}
              rx="2"
              fill={day.steps >= 8000 ? "var(--good)" : "var(--accent)"}
              opacity={day.steps ? 1 : 0.28}
            >
              <title>
                {formatPretty(day.date)}: {day.steps ? `${day.steps.toLocaleString()} steps` : "no steps logged"}
              </title>
            </rect>
            {index % 2 === 0 ? (
              <text x={x + barW / 2} y={height - 4} textAnchor="middle" fill="var(--muted)" fontSize="9">
                {parseISODate(day.date).getDate()}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
