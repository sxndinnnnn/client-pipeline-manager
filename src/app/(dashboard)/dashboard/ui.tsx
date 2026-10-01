import Link from "next/link";
import { formatLKR, formatUSD } from "@/lib/currency";

/* ------------------------------ Formatting ------------------------------ */

/** 1_250_000 -> "1.3M"; used where full LKR amounts would not fit (axes, bar labels). */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

export function formatPercent(value: number | null): string {
  return value == null ? "N/A" : `${Math.round(value)}%`;
}

// Rounds `maxValue` up to a "nice" number and returns evenly spaced ticks
// from 0 to that nice max, for a chart y-axis.
export function niceTicks(maxValue: number, targetCount = 4) {
  if (maxValue <= 0) return [0];
  const rawStep = maxValue / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceStep = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;
  const niceMax = Math.ceil(maxValue / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + niceStep / 2; v += niceStep) ticks.push(Math.round(v));
  return ticks;
}

/* ------------------------------ Tones ------------------------------ */

const toneText: Record<string, string> = {
  default: "text-foreground",
  good: "text-success",
  warning: "text-warning",
  critical: "text-error",
};

const badgeTone: Record<string, string> = {
  default: "bg-border text-muted",
  accent: "bg-primary/10 text-primary",
  good: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-error/10 text-error",
};

/* ------------------------- Building blocks ------------------------- */

export function StatTile({
  label,
  value,
  secondaryValue,
  secondary,
  note,
  icon,
  badgeToneKey = "accent",
  valueTone = "default",
}: {
  label: string;
  value: string;
  /** Shown beside the main value, separated by a divider (e.g. the USD amount next to LKR). */
  secondaryValue?: string;
  secondary?: string;
  note?: React.ReactNode;
  icon: React.ReactNode;
  badgeToneKey?: keyof typeof badgeTone;
  valueTone?: keyof typeof toneText;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 shadow-resting transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-raised">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${badgeTone[badgeToneKey]}`}
        >
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>
      <div>
        <p
          className={`flex flex-wrap items-baseline gap-x-3 text-2xl font-bold ${toneText[valueTone]}`}
        >
          <span>{value}</span>
          {secondaryValue && (
            <>
              <span className="font-normal text-subtle">|</span>
              <span>{secondaryValue}</span>
            </>
          )}
        </p>
        {secondary && <p className="text-xs text-muted">{secondary}</p>}
      </div>
      {note && (
        <div className="border-t border-border pt-2 text-xs text-subtle">{note}</div>
      )}
    </div>
  );
}

export function Panel({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-resting">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <span className="ml-auto text-xs text-subtle">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="-mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">{children}</h2>
  );
}

export function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: keyof typeof toneText;
}) {
  return (
    <div className="rounded-md bg-surface-sunken p-3">
      <p className={`text-xl font-bold ${toneText[tone]}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-subtle">{label}</p>
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-subtle">{children}</p>;
}

/* ------------------------------ Lists & tables ------------------------------ */

export function RankedList({
  rows,
  href,
}: {
  rows: { id: string; name: string; value: number }[];
  href?: (id: string) => string;
}) {
  return (
    <ol className="flex flex-col">
      {rows.map((c, i) => (
        <li
          key={c.id}
          className="flex items-center gap-2.5 border-t border-border py-2 text-sm first:border-t-0"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
            {i + 1}
          </span>
          {href ? (
            <Link href={href(c.id)} className="flex-1 truncate text-muted hover:text-foreground hover:underline">
              {c.name}
            </Link>
          ) : (
            <span className="flex-1 truncate text-muted">{c.name}</span>
          )}
          <span className="font-medium text-foreground">{formatLKR(c.value)}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------ Charts ------------------------------ */

type Series = { name: string; barClass: string; values: number[] };

export function Legend({ items }: { items: { name: string; dotClass: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
      {items.map((i) => (
        <span key={i.name} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${i.dotClass}`} />
          {i.name}
        </span>
      ))}
    </div>
  );
}

/** Side-by-side bars per category (e.g. per month), shared y-axis. */
export function GroupedBarChart({
  labels,
  series,
  format,
  maxOverride,
}: {
  labels: string[];
  series: Series[];
  format: (n: number) => string;
  /** Fix the axis maximum (e.g. 100 for percentages). */
  maxOverride?: number;
}) {
  const dataMax = Math.max(0, ...series.flatMap((s) => s.values));
  if (dataMax === 0) return <EmptyNote>No data in the last 12 months.</EmptyNote>;

  const ticks = maxOverride ? [0, maxOverride / 2, maxOverride] : niceTicks(dataMax);
  const chartMax = Math.max(1, ticks[ticks.length - 1]);
  const axisWidth = Math.max(36, format(chartMax).length * 7 + 12);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: `${axisWidth + labels.length * 36}px` }}>
        <div className="flex h-44">
          <div className="relative shrink-0" style={{ width: `${axisWidth}px` }}>
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-[11px] text-subtle"
                style={{ bottom: `${(tick / chartMax) * 100}%` }}
              >
                {format(tick)}
              </span>
            ))}
          </div>
          <div className="relative flex-1">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-border"
                style={{ bottom: `${(tick / chartMax) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-1.5">
              {labels.map((label, i) => (
                <div key={label} className="flex h-full flex-1 items-end justify-center gap-0.5">
                  {series.map((s) => (
                    <div
                      key={s.name}
                      className={`w-full max-w-4 rounded-t ${s.barClass}`}
                      style={{ height: `${(s.values[i] / chartMax) * 100}%` }}
                      title={`${label} · ${s.name}: ${format(s.values[i])}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex gap-1.5" style={{ paddingLeft: `${axisWidth}px` }}>
          {labels.map((label) => (
            <span key={label} className="flex-1 text-center text-[10px] text-subtle">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Cumulative actual vs target-pace lines across a year. */
export function LineChart({
  points,
}: {
  points: { label: string; actual: number | null; target: number | null }[];
}) {
  const values = points.flatMap((p) => [p.actual, p.target]).filter((v): v is number => v != null);
  const dataMax = Math.max(0, ...values);
  if (dataMax === 0) return <EmptyNote>No won revenue this year yet.</EmptyNote>;

  const ticks = niceTicks(dataMax);
  const chartMax = Math.max(1, ticks[ticks.length - 1]);
  const W = 600;
  const H = 200;
  const left = 56;
  const right = 12;
  const top = 10;
  const bottom = 24;
  const innerW = W - left - right;
  const innerH = H - top - bottom;
  const x = (i: number) => left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => top + innerH - (v / chartMax) * innerH;

  const line = (pick: (p: (typeof points)[number]) => number | null) =>
    points
      .map((p, i) => ({ v: pick(p), i }))
      .filter((p): p is { v: number; i: number } => p.v != null)
      .map((p) => `${x(p.i)},${y(p.v)}`)
      .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Cumulative won revenue versus target">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={W - right} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
          <text x={left - 6} y={y(tick) + 3} textAnchor="end" className="fill-subtle" fontSize={10}>
            {formatCompact(tick)}
          </text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={p.label} x={x(i)} y={H - 6} textAnchor="middle" className="fill-subtle" fontSize={10}>
          {p.label}
        </text>
      ))}
      {points.some((p) => p.target != null) && (
        <polyline
          points={line((p) => p.target)}
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 4"
          className="stroke-subtle"
        />
      )}
      <polyline points={line((p) => p.actual)} fill="none" strokeWidth={2.5} className="stroke-primary" />
      {points.map((p, i) =>
        p.actual != null ? (
          <circle key={p.label} cx={x(i)} cy={y(p.actual)} r={3} className="fill-primary">
            <title>{`${p.label}: ${formatLKR(p.actual)}`}</title>
          </circle>
        ) : null,
      )}
    </svg>
  );
}

export function StageBarChart({
  stageRows,
}: {
  stageRows: { name: string; count: number; value: number }[];
}) {
  if (stageRows.every((r) => r.count === 0)) {
    return <EmptyNote>No deals yet.</EmptyNote>;
  }

  const ticks = niceTicks(Math.max(...stageRows.map((r) => r.value)));
  const chartMax = Math.max(1, ticks[ticks.length - 1]);
  const axisWidth = Math.max(48, formatCompact(chartMax).length * 7 + 16);
  const chartMinWidth = axisWidth + stageRows.length * 80;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: `${chartMinWidth}px` }}>
        <div className="mt-6 flex h-56">
          <div className="relative shrink-0" style={{ width: `${axisWidth}px` }}>
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-xs text-subtle"
                style={{ bottom: `${(tick / chartMax) * 100}%` }}
              >
                {formatCompact(tick)}
              </span>
            ))}
          </div>
          <div className="relative flex-1">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-border"
                style={{ bottom: `${(tick / chartMax) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-3">
              {stageRows.map((row) => (
                <div
                  key={row.name}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-floating transition-opacity group-hover:opacity-100"
                    style={{ bottom: `calc(${(row.value / chartMax) * 100}% + 2rem)` }}
                  >
                    {row.count} Deal{row.count === 1 ? "" : "s"} · {formatLKR(row.value)}
                  </div>
                  {row.value > 0 && (
                    <span className="mb-1 text-xs font-medium text-muted">{formatCompact(row.value)}</span>
                  )}
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{ height: `${(row.value / chartMax) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 flex gap-3" style={{ paddingLeft: `${axisWidth}px` }}>
          {stageRows.map((row) => (
            <span key={row.name} className="flex-1 text-center text-xs text-subtle">
              {row.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export { formatLKR, formatUSD };
