import { createClient } from "@/lib/supabase/server";
import { formatLKR } from "@/lib/currency";
import type { Client, Deal } from "@/types/database";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

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

const toneText: Record<string, string> = {
  default: "text-zinc-900 dark:text-zinc-50",
  good: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
};

function StatTile({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "good" | "warning" | "critical";
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className={`text-2xl font-bold ${toneText[tone]}`}>{value}</p>
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      {sublabel && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{sublabel}</p>
      )}
    </div>
  );
}

function SectionHeading({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
      <span aria-hidden className="mr-1.5">
        {emoji}
      </span>
      {title}
    </h2>
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

  return (
    <>
      <div className="mt-3 flex h-56">
        <div className="relative w-20 shrink-0">
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
                  {row.count} deal{row.count === 1 ? "" : "s"}
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
      <div className="mt-2 flex gap-3 pl-20">
        {stageRows.map((row) => (
          <span key={row.name} className="flex-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {row.name}
          </span>
        ))}
      </div>
    </>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: deals }, { data: stages }, { data: clients }] = await Promise.all([
    supabase.from("deals").select("*"),
    supabase.from("pipeline_stages").select("*").order("sort_order", { ascending: true }),
    supabase.from("clients").select("id, name, created_at"),
  ]);

  const allDeals = (deals ?? []) as Deal[];
  const allClients = (clients ?? []) as Pick<Client, "id" | "name" | "created_at">[];

  const now = new Date();
  const thisMonthKey = monthKey(now);

  const openDeals = allDeals.filter((d) => d.status === "OPEN");
  const wonDeals = allDeals.filter((d) => d.status === "WON");
  const lostDeals = allDeals.filter((d) => d.status === "LOST");

  // Pipeline overview
  const totalOpenValue = numericValues(openDeals).reduce((sum, v) => sum + v, 0);
  const totalWonValue = numericValues(wonDeals).reduce((sum, v) => sum + v, 0);
  const decidedCount = wonDeals.length + lostDeals.length;
  const winRate = decidedCount > 0 ? (wonDeals.length / decidedCount) * 100 : null;
  const lostRate = decidedCount > 0 ? (lostDeals.length / decidedCount) * 100 : null;
  const cycleDays = wonDeals
    .filter((d) => d.closed_at)
    .map((d) => daysBetween(d.created_at, d.closed_at as string));
  const avgCycle = avg(cycleDays);
  const avgOpenSize = avg(numericValues(openDeals));
  const avgWonSize = avg(numericValues(wonDeals));

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
  const newClientsThisMonth = allClients.filter(
    (c) => monthKey(new Date(c.created_at)) === thisMonthKey
  ).length;
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
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <SectionHeading emoji="📈" title="Pipeline Overview" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Open Pipeline Value" value={formatLKR(totalOpenValue)} />
          <StatTile label="Open Deals" value={String(openDeals.length)} />
          <StatTile label="Won Pipeline Value" value={formatLKR(totalWonValue)} />
          <StatTile
            label="Win Rate"
            value={winRate != null ? `${Math.round(winRate)}%` : "N/A"}
          />
          <StatTile
            label="Lost Rate"
            value={lostRate != null ? `${Math.round(lostRate)}%` : "N/A"}
          />
          <StatTile
            label="Avg Sales Cycle"
            value={avgCycle != null ? `${Math.round(avgCycle)} Days` : "N/A"}
          />
          <StatTile
            label="Avg Open Deal Size"
            value={avgOpenSize != null ? formatLKR(avgOpenSize) : "N/A"}
          />
          <StatTile
            label="Avg Won Deal Size"
            value={avgWonSize != null ? formatLKR(avgWonSize) : "N/A"}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading emoji="🗂️" title="Pipeline By Stage" />
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <StageBarChart stageRows={stageRows} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading emoji="👥" title="Clients" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label="Total Clients"
            value={String(allClients.length)}
            sublabel={`${newClientsThisMonth} new this month`}
          />
          <StatTile
            label="Clients With No Open Deals"
            value={String(clientsWithNoOpenDeals)}
            sublabel="May need follow-up"
            tone={clientsWithNoOpenDeals > 0 ? "warning" : "good"}
          />
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Top Clients By Open Pipeline Value
            </p>
            {topClients.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No open deals yet.</p>
            ) : (
              <ol className="mt-2 flex flex-col gap-1.5">
                {topClients.map((c, i) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {i + 1}. {c.name}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatLKR(c.value)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
