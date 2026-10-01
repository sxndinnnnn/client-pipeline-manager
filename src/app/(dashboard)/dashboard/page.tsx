import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatLKR, formatUSD } from "@/lib/currency";
import { buildDashboardMetrics } from "@/lib/dashboard/metrics";
import type { Deal, PipelineStage, SalesTarget } from "@/types/database";
import {
  BarChartIcon,
  CheckCircleIcon,
  CrownIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/components/icons";
import {
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

export default async function DashboardPage() {
  const now = new Date();

  const supabase = await createClient();

  // sales_targets comes from migration 0112; until that has run the query errors,
  // `data` is null and the target widgets fall back to their empty state.
  const [{ data: deals }, { data: stages }, { data: clients }, { data: targets }] =
    await Promise.all([
      supabase.from("deals").select("*"),
      supabase.from("pipeline_stages").select("*").order("sort_order", { ascending: true }),
      supabase.from("clients").select("id, name, is_active"),
      supabase.from("sales_targets").select("*"),
    ]);

  const m = buildDashboardMetrics({
    now,
    deals: (deals ?? []) as Deal[],
    stages: (stages ?? []) as PipelineStage[],
    clients: clients ?? [],
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
          secondaryValue={formatUSD(m.open.value.usd)}
          icon={<TrendingUpIcon />}
        />
        <StatTile
          label="Closed Pipeline Value"
          value={formatLKR(m.headline.wonValue.lkr)}
          secondaryValue={formatUSD(m.headline.wonValue.usd)}
          icon={<CheckCircleIcon />}
          badgeToneKey="good"
        />
        <StatTile
          label="Lost Pipeline Value"
          value={formatLKR(m.headline.lostValue.lkr)}
          secondaryValue={formatUSD(m.headline.lostValue.usd)}
          icon={<TrendingDownIcon />}
          badgeToneKey="critical"
        />
        <StatTile
          label="Win Rate"
          value={formatPercent(m.headline.winRate)}
          secondaryValue={`${m.headline.wonCount} / ${m.headline.decidedCount} Deals`}
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
    </div>
  );
}
