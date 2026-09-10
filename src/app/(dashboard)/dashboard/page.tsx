import { createClient } from "@/lib/supabase/server";
import { formatLKR } from "@/lib/currency";
import type { Client, Deal } from "@/types/database";
import {
  BarChartIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  CrownIcon,
  TagIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/components/icons";

function avg(nums: number[]) {
  return nums.length ? nums.reduce((sum, n) => sum + n, 0) / nums.length : null;
}

function numericValues(deals: Deal[]) {
  return deals.map((d) => d.value).filter((v): v is number => v != null).map(Number);
}

// Rounds `maxValue` up to a "nice" number and returns evenly spaced ticks
// from 0 to that nice max, for a chart y-axis.
function niceTicks(maxValue: number, targetCount = 4) {
  if (maxValue <= 0) return [0];
  const rawStep = maxValue / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceStep =
    (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;
  const niceMax = Math.ceil(maxValue / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + niceStep / 2; v += niceStep) ticks.push(Math.round(v));
  return ticks;
}

/* ------------------------- Building blocks ------------------------- */

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

function StatTile({
  label,
  value,
  icon,
  badgeToneKey = "accent",
  valueTone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  badgeToneKey?: keyof typeof badgeTone;
  valueTone?: keyof typeof toneText;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 shadow-resting transition-all hover:-translate-y-0.5 hover:shadow-raised hover:border-border-strong">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${badgeTone[badgeToneKey]}`}>
        {icon}
      </span>
      <div>
        <p className={`text-2xl font-bold ${toneText[valueTone]}`}>{value}</p>
        <p className="text-xs uppercase tracking-wide text-subtle">{label}</p>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-resting">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function OpenDealsDonut({
  total,
  withValue,
  withoutValue,
}: {
  total: number;
  withValue: number;
  withoutValue: number;
}) {
  const r = 70;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;
  const withValueLen = total > 0 ? (withValue / total) * circumference : 0;
  const withoutValueLen = total > 0 ? (withoutValue / total) * circumference : 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-lg border border-border bg-surface p-5 shadow-resting sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-border"
          />
          {total > 0 && (
            <>
              <circle
                cx="100"
                cy="100"
                r={r}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={`${withValueLen} ${circumference - withValueLen}`}
                className="stroke-primary"
              />
              <circle
                cx="100"
                cy="100"
                r={r}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={`${withoutValueLen} ${circumference - withoutValueLen}`}
                strokeDashoffset={-withValueLen}
                className="stroke-warning"
              />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-tight text-foreground">
            {total}
          </span>
          <span className="text-[10px] font-semibold uppercase text-subtle">
            Open Deals
          </span>
        </div>
      </div>
      <div className="flex w-full max-w-[220px] flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
          <span className="flex-1 text-sm text-muted">
            Open Deals With Value
          </span>
          <span className="text-sm font-bold text-foreground">{withValue}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning" />
          <span className="flex-1 text-sm text-muted">
            Open Deals Without Value
          </span>
          <span className="text-sm font-bold text-foreground">{withoutValue}</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
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
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-subtle">
        {label}
      </p>
    </div>
  );
}

export function StageBarChart({
  stageRows,
}: {
  stageRows: { name: string; count: number; value: number }[];
}) {
  if (stageRows.every((r) => r.count === 0)) {
    return <p className="text-sm text-subtle">No deals yet.</p>;
  }

  const ticks = niceTicks(Math.max(...stageRows.map((r) => r.value)));
  const chartMax = Math.max(1, ticks[ticks.length - 1]);

  // Sized off the longest tick label so it never gets clipped by the
  // horizontal-scroll container to its right (was previously a fixed w-20,
  // which truncated once values grew past ~6 figures).
  const axisWidth = Math.max(64, formatLKR(chartMax).length * 7 + 16);

  // Below this many px the bar columns get too thin to read (value labels
  // collide, hover targets shrink) - horizontal-scroll the chart instead of
  // squeezing bars forever. Desktop content is always wider than this, so
  // it never triggers there - the chart renders identically to before.
  const chartMinWidth = axisWidth + stageRows.length * 90;

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
                {formatLKR(tick)}
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
                    {row.count} Deal{row.count === 1 ? "" : "s"}
                  </div>
                  {row.value > 0 && (
                    <span className="mb-1 text-xs font-medium text-muted">
                      {formatLKR(row.value)}
                    </span>
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
            <span
              key={row.name}
              className="flex-1 text-center text-xs text-subtle"
            >
              {row.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: deals }, { data: stages }, { data: clients }] = await Promise.all([
    supabase.from("deals").select("*"),
    supabase.from("pipeline_stages").select("*").order("sort_order", { ascending: true }),
    supabase.from("clients").select("id, name"),
  ]);

  const allDeals = (deals ?? []) as Deal[];
  const allClients = (clients ?? []) as Pick<Client, "id" | "name">[];

  const openDeals = allDeals.filter((d) => d.status === "OPEN");
  const wonDeals = allDeals.filter((d) => d.status === "WON");
  const lostDeals = allDeals.filter((d) => d.status === "LOST");

  // Pipeline overview
  const totalOpenValue = numericValues(openDeals).reduce((sum, v) => sum + v, 0);
  const totalWonValue = numericValues(wonDeals).reduce((sum, v) => sum + v, 0);
  const totalLostValue = numericValues(lostDeals).reduce((sum, v) => sum + v, 0);
  const decidedCount = wonDeals.length + lostDeals.length;
  const winRate = decidedCount > 0 ? (wonDeals.length / decidedCount) * 100 : null;
  const lostRate = decidedCount > 0 ? (lostDeals.length / decidedCount) * 100 : null;
  const avgOpenSize = avg(numericValues(openDeals));
  const openDealsWithValue = openDeals.filter((d) => d.value != null).length;
  const openDealsWithoutValue = openDeals.length - openDealsWithValue;
  const avgWonSize = avg(numericValues(wonDeals));
  const avgLostSize = avg(numericValues(lostDeals));

  // Pipeline by stage - every stage, including the terminal Won/Lost columns
  const dealsByStage = new Map<string, Deal[]>();
  for (const d of allDeals) {
    const key = d.stage_id ?? "none";
    dealsByStage.set(key, [...(dealsByStage.get(key) ?? []), d]);
  }
  const stageRows = (stages ?? []).map((s) => {
    const list = dealsByStage.get(s.id) ?? [];
    return { name: s.name, count: list.length, value: numericValues(list).reduce((sum, v) => sum + v, 0) };
  });

  // Clients
  const openDealsByClient = new Map<string, Deal[]>();
  for (const d of openDeals) {
    openDealsByClient.set(d.client_id, [...(openDealsByClient.get(d.client_id) ?? []), d]);
  }
  const clientsWithNoOpenDeals = allClients.filter((c) => !openDealsByClient.has(c.id)).length;
  const topClients = allClients
    .map((c) => ({
      id: c.id,
      name: c.name,
      value: numericValues(openDealsByClient.get(c.id) ?? []).reduce((s, v) => s + v, 0),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* Open */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
        <OpenDealsDonut
          total={openDeals.length}
          withValue={openDealsWithValue}
          withoutValue={openDealsWithoutValue}
        />
        <div className="flex flex-col gap-3">
          <StatTile
            label="Open Pipeline Value"
            value={formatLKR(totalOpenValue)}
            icon={<TrendingUpIcon />}
            badgeToneKey="accent"
          />
          <StatTile
            label="Avg Open Deal Size"
            value={avgOpenSize != null ? formatLKR(avgOpenSize) : "N/A"}
            icon={<TagIcon />}
            badgeToneKey="accent"
          />
        </div>
      </div>

      {/* Won */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Won Deals"
          value={String(wonDeals.length)}
          icon={<BriefcaseIcon />}
          badgeToneKey="good"
        />
        <StatTile
          label="Win Rate"
          value={winRate != null ? `${Math.round(winRate)}%` : "N/A"}
          icon={<TargetIcon />}
          badgeToneKey="good"
        />
        <StatTile
          label="Won Pipeline Value"
          value={formatLKR(totalWonValue)}
          icon={<CheckCircleIcon />}
          badgeToneKey="good"
        />
        <StatTile
          label="Avg Won Deal Size"
          value={avgWonSize != null ? formatLKR(avgWonSize) : "N/A"}
          icon={<TagIcon />}
          badgeToneKey="good"
        />
      </div>

      {/* Lost */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Lost Deals"
          value={String(lostDeals.length)}
          icon={<BriefcaseIcon />}
          badgeToneKey="critical"
        />
        <StatTile
          label="Lost Rate"
          value={lostRate != null ? `${Math.round(lostRate)}%` : "N/A"}
          icon={<TargetIcon />}
          badgeToneKey="critical"
        />
        <StatTile
          label="Lost Pipeline Value"
          value={formatLKR(totalLostValue)}
          icon={<TrendingDownIcon />}
          badgeToneKey="critical"
        />
        <StatTile
          label="Avg Lost Deal Size"
          value={avgLostSize != null ? formatLKR(avgLostSize) : "N/A"}
          icon={<TagIcon />}
          badgeToneKey="critical"
        />
      </div>

      {/* Pipeline By Stage + Clients, side by side on wide screens */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Pipeline By Stage" icon={<BarChartIcon />}>
          <StageBarChart stageRows={stageRows} />
        </Panel>

        <Panel title="Clients" icon={<UsersIcon />}>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <MiniStat label="Total Clients" value={String(allClients.length)} />
            <MiniStat
              label="No Open Deals"
              value={String(clientsWithNoOpenDeals)}
              tone={clientsWithNoOpenDeals > 0 ? "warning" : "good"}
            />
          </div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">
            <CrownIcon className="h-3 w-3" />
            Top Clients By Open Pipeline Value
          </div>
          {topClients.length === 0 ? (
            <p className="text-sm text-subtle">No open deals yet.</p>
          ) : (
            <ol className="flex flex-col">
              {topClients.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2.5 border-t border-border py-2 text-sm first:border-t-0"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-muted">{c.name}</span>
                  <span className="font-medium text-foreground">
                    {formatLKR(c.value)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
