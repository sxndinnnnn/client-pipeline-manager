import { createClient } from "@/lib/supabase/server";
import type { PriceLine } from "@/lib/plan-lines";

/** A deal's title is always its plan's name. */
export async function getPlanName(planId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("plans").select("name").eq("id", planId).single();
  if (error || !data) throw new Error("Selected plan not found");
  return data.name;
}

/**
 * The plan's current price, copied onto a deal when the plan is set so later edits to
 * the plan in Settings do not change what the deal was sold at.
 */
export async function getPlanPriceSnapshot(
  planId: string
): Promise<{ plan_amount_lkr: number | null; plan_amount_usd: number | null }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("amount_lkr, amount_usd")
    .eq("id", planId)
    .single();
  return {
    plan_amount_lkr: data?.amount_lkr ?? null,
    plan_amount_usd: data?.amount_usd ?? null,
  };
}

/** PostgREST error code for "column not found" - i.e. migration 0138 has not been run yet. */
export const MISSING_COLUMN_CODE = "PGRST204";

const DEAL_LINES_HINT =
  "Per-platform deal pricing isn't set up yet. Run migration 0143_deal_platforms.sql in the Supabase SQL Editor first.";

/** Replaces the deal's own copy of its plan lines (delete, then insert). */
export async function saveDealLines(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealId: string,
  lines: PriceLine[]
): Promise<string | null> {
  const { error: deleteError } = await supabase.from("deal_platforms").delete().eq("deal_id", dealId);
  if (deleteError) {
    return deleteError.code === "PGRST205" || deleteError.code === "42P01"
      ? DEAL_LINES_HINT
      : deleteError.message;
  }
  if (lines.length === 0) return null;
  const { error } = await supabase
    .from("deal_platforms")
    .insert(lines.map((l) => ({ ...l, deal_id: dealId })));
  return error ? error.message : null;
}
