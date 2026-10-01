import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatLKR, formatUSD } from "@/lib/currency";
import { buildDashboardMetrics, STALE_DAYS, type GroupRow } from "@/lib/dashboard/metrics";
import { resolvePeriod } from "@/lib/dashboard/period";
import type {
  Deal,
  DealStageEvent,
  Plan,
  PipelineStage,
  SalesTarget,
} from "@/types/database";
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
  ValueIcon,
} from "@/components/icons";
import {
  BarList,
  DataTable,
  EmptyNote,
  GroupedBarChart,
  Legend,
  LineChart,
  MiniStat,
  Panel,
  RankedList,
  SectionHeading,
  StageBarChart,
  StatTile,
  formatCompact,
  formatPercent,
} from "./ui";

const DAY_MS = 24 * 60 * 60 * 1000;

function GroupTable({ rows, label }: { rows: GroupRow[]; label: string }) {
  if (rows.length === 0) return <EmptyNote>No closed deals yet.</EmptyNote>;
  return (
    <DataTable
      columns={[
        { label },
        { label: "Won", align: "right" },
        { label: "Won Value", align: "right" },
        { label: "Win Rate", align: "right" },
      ]}
      rows={rows.map((r) => [r.name, r.won, formatLKR(r.wonValue), formatPercent(r.winRate)])}
    />
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const period = resolvePeriod("all", now);

  const supabase = await createClient();
  const activitySince = new Date(now.getTime() - 400 * DAY_MS).toISOString();

  // Tables added by migration 0112 may not exist yet; their queries then return
  // an error and `data: null`, which the `?? []` fallbacks below turn into empty states.
  const [
    { data: deals },
    { data: stages },
    { data: clients },
    { data: plans },
    { data: activities },
    { data: events },
    { data: profiles },
    { data: targets },
  ] = await Promise.all([
    supabase.from("deals").select("*"),
    supabase.from("pipeline_stages").select("*").order("sort_order", { ascending: true }),
    supabase.from("clients").select("id, name, industry, is_active, created_at"),
    supabase.from("plans").select("*"),
    supabase
      .from("activities")
      .select("deal_id, author_id, created_at, content")
      .gte("created_at", activitySince),
    supabase.from("deal_stage_events").select("*"),
    supabase.from("user_profiles").select("id, name, email"),
    supabase.from("sales_targets").select("*"),
  ]);

  const m = buildDashboardMetrics({
    now,
    period,
    deals: (deals ?? []) as Deal[],
    stages: (stages ?? []) as PipelineStage[],
    clients: clients ?? [],
    plans: (plans ?? []) as Plan[],
    activities: activities ?? [],
    events: (events ?? []) as DealStageEvent[],
    profiles: profiles ?? [],
    targets: (targets ?? []) as SalesTarget[],
  });

  const hasTarget = m.target.amount != null;
  const monthLabels = m.trend.map((t) => t.label);

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------ Headline ------------------------------ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Open Pipeline Value"
          value={formatLKR(m.open.value.lkr)}
          secondary={m.open.value.usd > 0 ? formatUSD(m.open.value.usd) : undefined}
          icon={<TrendingUpIcon />}
        />
        <StatTile
          label="Closed Pipeline Value"
          value={formatLKR(m.headline.wonValue.lkr)}
          secondary={m.headline.wonValue.usd > 0 ? formatUSD(m.headline.wonValue.usd) : undefined}
          icon={<CheckCircleIcon />}
          badgeToneKey="good"
        />
        <StatTile
          label="Lost Pipeline Value"
          value={formatLKR(m.headline.lostValue.lkr)}
          secondary={m.headline.lostValue.usd > 0 ? formatUSD(m.headline.lostValue.usd) : undefined}
          icon={<TrendingDownIcon />}
          badgeToneKey="critical"
        />
        <StatTile
          label="Win Rate"
          value={formatPercent(m.headline.winRate)}
          icon={<TargetIcon />}
          badgeToneKey="good"
        />
      </div>

      {/* ---------------------------- Pipeline health ---------------------------- */}
      <SectionHeading>Pipeline Health</SectionHeading>
      <Panel title="Pipeline By Stage" icon={<BarChartIcon />}>
        <StageBarChart stageRows={m.stageRows} />
      </Panel>

      {/* --------------------------------- Trends --------------------------------- */}
      <SectionHeading>Trends · Last 12 Months</SectionHeading>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Won vs Lost Value" icon={<BarChartIcon />}>
          <Legend
            items={[
              { name: "Won", dotClass: "bg-success" },
              { name: "Lost", dotClass: "bg-error" },
            ]}
          />
          <GroupedBarChart
            labels={monthLabels}
            format={formatCompact}
            series={[
              { name: "Won", barClass: "bg-success", values: m.trend.map((t) => t.wonValue) },
              { name: "Lost", barClass: "bg-error", values: m.trend.map((t) => t.lostValue) },
            ]}
          />
        </Panel>
        <Panel
          title={`Cumulative Revenue vs Target ${m.target.year}`}
          icon={<TrendingUpIcon />}
        >
          <Legend
            items={[
              { name: "Won revenue", dotClass: "bg-primary" },
              ...(hasTarget ? [{ name: "Target pace", dotClass: "bg-subtle" }] : []),
            ]}
          />
          <LineChart points={m.cumulative} />
          {!hasTarget && (
            <p className="mt-2 text-xs text-subtle">
              <Link href="/settings/targets" className="text-primary hover:underline">
                Set a yearly target
              </Link>{" "}
              to see the pace line.
            </p>
          )}
        </Panel>
      </div>

      {/* ---------------------------- Needs attention ---------------------------- */}
      <SectionHeading>Needs Attention</SectionHeading>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Stale Open Deals" icon={<BriefcaseIcon />} subtitle={`${STALE_DAYS}+ days without activity`}>
          {m.staleDeals.length === 0 ? (
            <EmptyNote>Every open deal has been touched in the last {STALE_DAYS} days.</EmptyNote>
          ) : (
            <DataTable
              columns={[
                { label: "Deal" },
                { label: "Stage" },
                { label: "Value", align: "right" },
                { label: "Idle", align: "right" },
              ]}
              rows={m.staleDeals.slice(0, 6).map((d) => [
                <Link key={d.id} href={`/deals/${d.id}`} className="hover:text-foreground hover:underline">
                  {d.client} · {d.title}
                </Link>,
                d.stage,
                d.value > 0 ? formatLKR(d.value) : "-",
                `${d.idleDays} days`,
              ])}
            />
          )}
          {m.staleDeals.length > 6 && (
            <p className="mt-2 text-xs text-subtle">+ {m.staleDeals.length - 6} more</p>
          )}
        </Panel>

        <Panel title="Loss Analysis" icon={<TrendingDownIcon />} subtitle={period.label}>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <MiniStat label="Lost Deals" value={String(m.headline.lostCount)} tone={m.headline.lostCount > 0 ? "critical" : "default"} />
            <MiniStat label="Lost Value" value={formatLKR(m.headline.lostValue.lkr)} tone={m.headline.lostValue.lkr > 0 ? "critical" : "default"} />
          </div>
          {m.headline.lostCount === 0 ? (
            <EmptyNote>No deals lost yet.</EmptyNote>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">
                  Why deals were lost
                </p>
                <BarList
                  rows={m.loss.reasons.map((r) => ({ name: r.name, value: r.count }))}
                  tone="bg-error"
                />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">
                  Stage where lost
                </p>
                <BarList
                  rows={m.loss.lostAt.map((r) => ({ name: r.name, value: r.count }))}
                  tone="bg-warning"
                />
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* --------------------------------- Clients --------------------------------- */}
      <SectionHeading>Clients</SectionHeading>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Client Base" icon={<UsersIcon />}>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Active" value={String(m.clients.active)} tone="good" />
            <MiniStat label="Inactive" value={String(m.clients.inactive)} />
            <MiniStat
              label="Active, No Open Deals"
              value={String(m.clients.activeWithoutOpenDeals)}
              tone={m.clients.activeWithoutOpenDeals > 0 ? "warning" : "good"}
            />
            <MiniStat label="Total Clients" value={String(m.clients.total)} />
          </div>
          <p className="mt-3 text-xs text-subtle">
            {m.clients.top3Share != null
              ? `Top 3 clients make up ${Math.round(m.clients.top3Share)}% of all won revenue.`
              : "Won revenue concentration appears once deals are won."}
          </p>
        </Panel>
        <Panel title="Top Clients By Open Value" icon={<CrownIcon />}>
          {m.clients.topByOpen.length === 0 ? (
            <EmptyNote>No open deals yet.</EmptyNote>
          ) : (
            <RankedList rows={m.clients.topByOpen} href={(id) => `/clients/${id}`} />
          )}
        </Panel>
        <Panel title="Top Clients By Won Value" icon={<CrownIcon />} subtitle="All time">
          {m.clients.topByWon.length === 0 ? (
            <EmptyNote>No won deals yet.</EmptyNote>
          ) : (
            <RankedList rows={m.clients.topByWon} href={(id) => `/clients/${id}`} />
          )}
        </Panel>
      </div>

      {/* --------------------------- Plans & industries --------------------------- */}
      <SectionHeading>Plans &amp; Industries · {period.label}</SectionHeading>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="By Plan" icon={<TagIcon />}>
          <GroupTable rows={m.byPlan} label="Plan" />
        </Panel>
        <Panel title="By Industry" icon={<BriefcaseIcon />}>
          <GroupTable rows={m.byIndustry} label="Industry" />
        </Panel>
      </div>
      <Panel title="Won Deals vs Plan Price" icon={<ValueIcon />} subtitle="Same rule as the Gain / Loss report">
        {m.planVariance.comparable === 0 ? (
          <EmptyNote>No won deals have both a plan price and a deal value.</EmptyNote>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat
              label="Net vs Plan (LKR)"
              value={`${m.planVariance.netLkr >= 0 ? "+" : "-"}${formatLKR(Math.abs(m.planVariance.netLkr))}`}
              tone={m.planVariance.netLkr >= 0 ? "good" : "critical"}
            />
            <MiniStat
              label="Net vs Plan (USD)"
              value={`${m.planVariance.netUsd >= 0 ? "+" : "-"}${formatUSD(Math.abs(m.planVariance.netUsd))}`}
              tone={m.planVariance.netUsd >= 0 ? "good" : "critical"}
            />
            <MiniStat label="Deals Compared" value={String(m.planVariance.comparable)} />
            <MiniStat
              label="Closed Below Plan"
              value={String(m.planVariance.belowPlan)}
              tone={m.planVariance.belowPlan > 0 ? "warning" : "good"}
            />
          </div>
        )}
      </Panel>

      {/* ---------------------------------- Team ---------------------------------- */}
      <SectionHeading>Team · {period.label}</SectionHeading>
      <Panel title="Activity &amp; Results By Owner" icon={<UsersIcon />}>
        {m.team.length === 0 ? (
          <EmptyNote>No activity yet.</EmptyNote>
        ) : (
          <DataTable
            columns={[
              { label: "Team Member" },
              { label: "Activities Logged", align: "right" },
              { label: "Open Deals", align: "right" },
              { label: "Open Value", align: "right" },
              { label: "Won", align: "right" },
              { label: "Won Value", align: "right" },
            ]}
            rows={m.team.map((p) => [
              p.name,
              p.activities,
              p.openDeals,
              formatLKR(p.openValue),
              p.won,
              formatLKR(p.wonValue),
            ])}
          />
        )}
      </Panel>
    </div>
  );
}
