import { createClient } from "@/lib/supabase/server";
import { ClientTabs } from "@/app/(dashboard)/clients/[id]/client-tabs";
import { buildGainLossRows, GainLossReport, type RawWonDeal } from "./gain-loss-report";

// Reports live here as one tab each. To add a new one: fetch its data below,
// write a "<name>-report.tsx" with a row-builder + presentational table (see
// gain-loss-report.tsx for the shape), and add it to the `tabs` array.
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const { report } = await searchParams;
  const supabase = await createClient();

  const joins = "clients(name), pipeline_stages(name), plans(name, amount_lkr, amount_usd)";
  const wonDealsQuery = (columns: string) =>
    supabase
      .from("deals")
      .select(`${columns}, ${joins}`)
      .eq("status", "WON")
      .order("closed_at", { ascending: false });

  // plan_amount_* come from migration 0138; fall back to the live plan price without them.
  const withSnapshot = await wonDealsQuery(
    "id, value, value_usd, closed_at, plan_amount_lkr, plan_amount_usd"
  );
  const wonDeals = withSnapshot.error
    ? (await wonDealsQuery("id, value, value_usd, closed_at")).data
    : withSnapshot.data;

  const gainLossRows = buildGainLossRows((wonDeals ?? []) as unknown as RawWonDeal[]);

  return (
    <ClientTabs
      defaultTab={report}
      tabs={[
        {
          key: "gain-loss",
          label: "Gain / Loss",
          content: <GainLossReport rows={gainLossRows} />,
        },
      ]}
    />
  );
}
