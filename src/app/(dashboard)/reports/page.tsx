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

  const { data: wonDeals } = await supabase
    .from("deals")
    .select("id, value, value_usd, closed_at, clients(name), plans(name, amount_lkr, amount_usd)")
    .eq("status", "WON")
    .order("closed_at", { ascending: false });

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
