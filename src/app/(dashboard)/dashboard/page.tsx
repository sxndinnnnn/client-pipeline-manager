import { createClient } from "@/lib/supabase/server";
import { formatLKR } from "@/lib/currency";
import type { Activity, ActivityType, Client, Deal } from "@/types/database";

const STALE_DAYS = 14;

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  note: "notes",
  call: "calls",
  email: "emails",
  meeting: "meetings",
};

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

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: deals }, { data: stages }, { data: activities }, { data: tasks }, { data: clients }] =
    await Promise.all([
      supabase.from("deals").select("*"),
      supabase.from("pipeline_stages").select("*").order("sort_order", { ascending: true }),
      supabase.from("activities").select("id, deal_id, type, created_at"),
      supabase.from("tasks").select("id, deal_id, status, due_date"),
      supabase.from("clients").select("id, name, created_at"),
    ]);

  const allDeals = (deals ?? []) as Deal[];
  const allActivities = (activities ?? []) as Pick<Activity, "id" | "deal_id" | "type" | "created_at">[];
  const allClients = (clients ?? []) as Pick<Client, "id" | "name" | "created_at">[];
  const allTasks = tasks ?? [];

  const now = new Date();
  const todayStart = new Date(now.toDateString());
  const thisMonthKey = monthKey(now);
  const lastMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const openDeals = allDeals.filter((d) => d.status === "OPEN");
  const wonDeals = allDeals.filter((d) => d.status === "WON");
  const lostDeals = allDeals.filter((d) => d.status === "LOST");

  // Pipeline overview
  const totalOpenValue = numericValues(openDeals).reduce((sum, v) => sum + v, 0);
  const decidedCount = wonDeals.length + lostDeals.length;
  const winRate = decidedCount > 0 ? (wonDeals.length / decidedCount) * 100 : null;
  const cycleDays = wonDeals
    .filter((d) => d.closed_at)
    .map((d) => daysBetween(d.created_at, d.closed_at as string));
  const avgCycle = avg(cycleDays);
  const avgOpenSize = avg(numericValues(openDeals));
  const avgWonSize = avg(numericValues(wonDeals));

  // Pipeline by stage (open deals only - Won/Lost aren't "in" the pipeline anymore)
  const openStages = (stages ?? []).filter((s) => s.name !== "Won" && s.name !== "Lost");
  const dealsByStage = new Map<string, Deal[]>();
  for (const d of openDeals) {
    const key = d.stage_id ?? "none";
    dealsByStage.set(key, [...(dealsByStage.get(key) ?? []), d]);
  }
  const stageRows = openStages.map((s) => {
    const list = dealsByStage.get(s.id) ?? [];
    return { name: s.name, count: list.length, value: numericValues(list).reduce((sum, v) => sum + v, 0) };
  });
  const maxStageValue = Math.max(1, ...stageRows.map((r) => r.value));

  // This month
  const dealsClosingThisMonth = openDeals.filter(
    (d) => d.expected_close_date && d.expected_close_date.slice(0, 7) === thisMonthKey
  );
  const dealsClosingThisMonthValue = numericValues(dealsClosingThisMonth).reduce((s, v) => s + v, 0);
  const revenueThisMonth = numericValues(
    wonDeals.filter((d) => d.closed_at && monthKey(new Date(d.closed_at)) === thisMonthKey)
  ).reduce((s, v) => s + v, 0);
  const revenueLastMonth = numericValues(
    wonDeals.filter((d) => d.closed_at && monthKey(new Date(d.closed_at)) === lastMonthKey)
  ).reduce((s, v) => s + v, 0);
  const revenueDeltaPct =
    revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : null;

  // Needs attention
  const overdueDeals = openDeals.filter(
    (d) => d.expected_close_date && new Date(d.expected_close_date) < todayStart
  );
  const lastActivityByDeal = new Map<string, string>();
  for (const a of allActivities) {
    const existing = lastActivityByDeal.get(a.deal_id);
    if (!existing || a.created_at > existing) lastActivityByDeal.set(a.deal_id, a.created_at);
  }
  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS);
  const staleDeals = openDeals.filter((d) => {
    const lastTouch = lastActivityByDeal.get(d.id) ?? d.created_at;
    return new Date(lastTouch) < staleCutoff;
  });

  // Activity & tasks
  const weekCutoff = new Date();
  weekCutoff.setDate(weekCutoff.getDate() - 7);
  const recentActivities = allActivities.filter((a) => new Date(a.created_at) >= weekCutoff);
  const activityByType: Partial<Record<ActivityType, number>> = {};
  for (const a of recentActivities) {
    activityByType[a.type] = (activityByType[a.type] ?? 0) + 1;
  }
  const activityBreakdown = (Object.entries(activityByType) as [ActivityType, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${count} ${ACTIVITY_TYPE_LABELS[type]}`)
    .join(" · ");

  const openTasks = allTasks.filter((t) => t.status === "PENDING");
  const overdueTasks = openTasks.filter((t) => t.due_date && new Date(t.due_date) < todayStart);

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
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        <span aria-hidden className="mr-2">
          📊
        </span>
        Dashboard
      </h1>

      <section className="flex flex-col gap-3">
        <SectionHeading emoji="📈" title="Pipeline Overview" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            label="Open Pipeline Value"
            value={formatLKR(totalOpenValue)}
            sublabel={`${openDeals.length} open deals`}
          />
          <StatTile
            label="Win Rate"
            value={winRate != null ? `${Math.round(winRate)}%` : "N/A"}
            sublabel={`${wonDeals.length} won, ${lostDeals.length} lost`}
          />
          <StatTile
            label="Avg Sales Cycle"
            value={avgCycle != null ? `${Math.round(avgCycle)} days` : "N/A"}
            sublabel="Won deals, lead to close"
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
          {stageRows.every((r) => r.count === 0) ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No open deals yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stageRows.map((row) => (
                <div key={row.name} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
                    {row.name}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded bg-blue-600 dark:bg-blue-500"
                      style={{ width: `${(row.value / maxStageValue) * 100}%` }}
                    />
                  </div>
                  <span className="w-40 shrink-0 text-right text-sm text-zinc-600 dark:text-zinc-400">
                    {row.count} deal{row.count === 1 ? "" : "s"} &middot; {formatLKR(row.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading emoji="📅" title="This Month" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <StatTile
            label="Deals Closing This Month"
            value={String(dealsClosingThisMonth.length)}
            sublabel={formatLKR(dealsClosingThisMonthValue)}
          />
          <StatTile
            label="Revenue Won This Month"
            value={formatLKR(revenueThisMonth)}
            sublabel={
              revenueDeltaPct != null
                ? `${revenueDeltaPct >= 0 ? "+" : ""}${Math.round(revenueDeltaPct)}% vs last month`
                : "No data for last month"
            }
            tone={revenueDeltaPct != null ? (revenueDeltaPct >= 0 ? "good" : "critical") : "default"}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading emoji="⚠️" title="Needs Attention" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            label="Overdue Deals"
            value={String(overdueDeals.length)}
            sublabel="Past expected close date"
            tone={overdueDeals.length > 0 ? "critical" : "good"}
          />
          <StatTile
            label="Stale Deals"
            value={String(staleDeals.length)}
            sublabel={`No activity in ${STALE_DAYS}+ days`}
            tone={staleDeals.length > 0 ? "warning" : "good"}
          />
          <StatTile
            label="Overdue Tasks"
            value={String(overdueTasks.length)}
            tone={overdueTasks.length > 0 ? "warning" : "good"}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading emoji="📝" title="Activity & Tasks" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <StatTile
            label="Activity Logged (7 Days)"
            value={String(recentActivities.length)}
            sublabel={activityBreakdown || "Nothing logged this week"}
          />
          <StatTile
            label="Open Tasks"
            value={String(openTasks.length)}
            sublabel={`${overdueTasks.length} overdue`}
          />
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
