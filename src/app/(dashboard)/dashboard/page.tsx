import { createClient } from "@/lib/supabase/server";
import { formatLKR } from "@/lib/currency";
import type { Client, Deal } from "@/types/database";

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

/* ---------------------------- Icons ---------------------------- */

function TrendingUpIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 7h7v7" />
    </svg>
  );
}

function BriefcaseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <rect x="2.5" y="7" width="19" height="13.5" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 20.5V5.5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12.5h19" />
    </svg>
  );
}

function CheckCircleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.3 12.3l2.6 2.6 5-5.2" />
    </svg>
  );
}

function TargetIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrendingDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l6 6 4-4 8 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10v7h-7" />
    </svg>
  );
}

function TagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 12.7L12.3 21 3 11.7V3h8.7z" />
      <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UsersIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="9" cy="7.8" r="3.3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.3 20.2a6.7 6.7 0 0 1 13.4 0" />
      <circle cx="17.3" cy="8.6" r="2.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.6 12.9a5.3 5.3 0 0 1 6.1 5.2" />
    </svg>
  );
}

function BarChartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V10M12 21V4M19 21v-7" />
    </svg>
  );
}

function CrownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 18.5l-1.5-9 5.2 3.8L12 6l4.8 7.3 5.2-3.8-1.5 9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 18.5h17" />
    </svg>
  );
}

/* ------------------------- Building blocks ------------------------- */

const toneText: Record<string, string> = {
  default: "text-zinc-900 dark:text-zinc-50",
  good: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
};

const badgeTone: Record<string, string> = {
  default: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  accent: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  good: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  critical: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
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
    <div className="flex flex-col gap-2.5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${badgeTone[badgeToneKey]}`}>
        {icon}
      </span>
      <div>
        <p className={`text-2xl font-bold ${toneText[valueTone]}`}>{value}</p>
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
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
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
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
    <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-zinc-100 dark:stroke-zinc-800"
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
                className="stroke-blue-600 dark:stroke-blue-400"
              />
              <circle
                cx="100"
                cy="100"
                r={r}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={`${withoutValueLen} ${circumference - withoutValueLen}`}
                strokeDashoffset={-withValueLen}
                className="stroke-amber-500 dark:stroke-amber-400"
              />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
            {total}
          </span>
          <span className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            Open Deals
          </span>
        </div>
      </div>
      <div className="flex w-full max-w-[220px] flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
            Open Deals With Value
          </span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{withValue}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
          <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
            Open Deals Without Value
          </span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{withoutValue}</span>
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
    <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/60">
      <p className={`text-xl font-bold ${toneText[tone]}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No deals yet.</p>;
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
                className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-xs text-zinc-400 dark:text-zinc-500"
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
                className="absolute inset-x-0 border-t border-zinc-100 dark:border-zinc-800"
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
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
                    style={{ bottom: `calc(${(row.value / chartMax) * 100}% + 2rem)` }}
                  >
                    {row.count} Deal{row.count === 1 ? "" : "s"}
                  </div>
                  {row.value > 0 && (
                    <span className="mb-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {formatLKR(row.value)}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t bg-blue-600 dark:bg-blue-500"
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
              className="flex-1 text-center text-xs text-zinc-500 dark:text-zinc-400"
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
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <CrownIcon className="h-3 w-3" />
            Top Clients By Open Pipeline Value
          </div>
          {topClients.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No open deals yet.</p>
          ) : (
            <ol className="flex flex-col">
              {topClients.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2.5 border-t border-zinc-100 py-2 text-sm first:border-t-0 dark:border-zinc-800"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[11px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-zinc-700 dark:text-zinc-300">{c.name}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
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
