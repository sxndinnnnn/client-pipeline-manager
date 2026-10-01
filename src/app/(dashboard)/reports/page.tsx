import { createClient } from "@/lib/supabase/server";
import { ClientTabs } from "@/app/(dashboard)/clients/[id]/client-tabs";
import {
  buildGainLossRows,
  GainLossReport,
  OPEN_REPORT,
  WON_REPORT,
  type RawWonDeal,
} from "./gain-loss-report";

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
  const dealsQuery = (status: "WON" | "OPEN", columns: string, orderBy: string) =>
    supabase
      .from("deals")
      .select(`${columns}, ${joins}`)
      .eq("status", status)
      .order(orderBy, { ascending: false });

  // plan_amount_* come from migration 0138; fall back to the live plan price without them.
  async function loadDeals(status: "WON" | "OPEN", orderBy: string) {
    const base = "id, client_id, value, value_usd, closed_at, created_at";
    const withSnapshot = await dealsQuery(status, `${base}, plan_amount_lkr, plan_amount_usd`, orderBy);
    const result = withSnapshot.error ? await dealsQuery(status, base, orderBy) : withSnapshot;
    return (result.data ?? []) as unknown as RawWonDeal[];
  }

  const [wonDeals, openDeals] = await Promise.all([
    loadDeals("WON", "closed_at"),
    loadDeals("OPEN", "created_at"),
  ]);

  return (
    <ClientTabs
      defaultTab={report}
      tabs={[
        {
          key: "gain-loss",
          label: "Gain / Loss",
          content: <GainLossReport rows={buildGainLossRows(wonDeals)} variant={WON_REPORT} />,
        },
        {
          key: "open-deals",
          label: "Open Deals",
          content: (
            <GainLossReport
              rows={buildGainLossRows(openDeals, "created_at")}
              variant={OPEN_REPORT}
            />
          ),
        },
      ]}
    />
  );
}
