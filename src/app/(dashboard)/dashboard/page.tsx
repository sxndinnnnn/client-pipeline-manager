import { createClient } from "@/lib/supabase/server";
import { formatLKR, formatUSD } from "@/lib/currency";
import { buildDashboardMetrics } from "@/lib/dashboard/metrics";
import type { Deal, PipelineStage, SalesTarget } from "@/types/database";
import {
  BarChartIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  CrownIcon,
  LayersIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TrophyIcon,
  UsersIcon,
  ValueIcon,
} from "@/components/icons";
import {
  EmptyNote,
  GroupedBarChart,
  Legend,
  LineChart,
  MiniStat,
  Panel,
  RankedList,
  StageBarChart,
  StatTile,
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
          icon={<ValueIcon />}
          badgeToneKey="sky"
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
          secondaryValue={`${m.headline.wonCount} / ${m.headline.totalDeals} Deals`}
          icon={<TrophyIcon />}
          badgeToneKey="gold"
        />
      </div>

      {/* ---------------------------- Pipeline health ---------------------------- */}
      <Panel title="Pipeline By Stage" icon={<LayersIcon />} iconTone="teal">
        <StageBarChart stageRows={m.stageRows} />
      </Panel>

      {/* --------------------------------- Trends --------------------------------- */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Won vs Lost Value" icon={<BarChartIcon />} iconTone="orange">
          <Legend
            items={[
              { name: "Won", dotClass: "bg-success" },
              { name: "Lost", dotClass: "bg-error" },
            ]}
          />
          <GroupedBarChart
            labels={monthLabels}
            series={[
              {
                name: "Won",
                barClass: "bg-success",
                values: m.trend.map((t) => t.wonValue),
                usdValues: m.trend.map((t) => t.wonValueUsd),
              },
              {
                name: "Lost",
                barClass: "bg-error",
                values: m.trend.map((t) => t.lostValue),
                usdValues: m.trend.map((t) => t.lostValueUsd),
              },
            ]}
          />
        </Panel>
        <Panel title="Cumulative Revenue vs Target" icon={<TrendingUpIcon />} iconTone="good">
          <Legend
            items={[
              { name: "Won Revenue", dotClass: "bg-success" },
              ...(hasTarget ? [{ name: "Target Revenue", dotClass: "bg-subtle" }] : []),
            ]}
          />
          <LineChart points={m.cumulative} />
        </Panel>
      </div>

      {/* --------------------------------- Clients --------------------------------- */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Client Base" icon={<UsersIcon />} iconTone="purple">
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
        </Panel>
        <Panel title="Top Clients By Open Value" icon={<BriefcaseIcon />} iconTone="sky">
          {m.clients.topByOpen.length === 0 ? (
            <EmptyNote>No open deals yet.</EmptyNote>
          ) : (
            <RankedList rows={m.clients.topByOpen} href={(id) => `/clients/${id}`} />
          )}
        </Panel>
        <Panel title="Top Clients By Won Value" icon={<CrownIcon />} iconTone="gold">
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
