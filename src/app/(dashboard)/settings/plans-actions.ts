"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";
import { parseLines, selectedPlatforms, totalsOf, type PriceLine } from "@/lib/plan-lines";

const MIGRATION_HINT =
  "Per-platform pricing isn't set up yet. Run migration 0142_plan_platforms.sql in the Supabase SQL Editor first.";

/** The plan's own columns, computed from its priced lines (Units is stored as vehicle_count). */
function planTotals(lines: PriceLine[]) {
  const t = totalsOf(lines);
  return {
    amount_lkr: t.amount_lkr,
    amount_usd: t.amount_usd,
    vehicle_count: t.units,
    shipment_count: t.shipments,
  };
}

function tableMissing(error: { code?: string }): boolean {
  return error.code === "PGRST205" || error.code === "42P01";
}

function readPlanFields(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Plan name is required");
  const platforms = selectedPlatforms(formData);
  return {
    name,
    platforms,
    lines: parseLines(formData, platforms),
    valid_from: (formData.get("valid_from") as string) || null,
    valid_to: (formData.get("valid_to") as string) || null,
  };
}

async function createPlanImpl(formData: FormData) {
  const supabase = await createClient();
  const { name, platforms, lines, valid_from, valid_to } = readPlanFields(formData);

  const { data: plan, error } = await supabase
    .from("plans")
    .insert({
      name,
      platforms,
      ...(lines.length > 0
        ? planTotals(lines)
        : { amount_lkr: null, amount_usd: null, vehicle_count: null, shipment_count: null }),
      valid_from,
      valid_to,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (lines.length > 0) {
    const { error: lineError } = await supabase
      .from("plan_platforms")
      .insert(lines.map((l) => ({ ...l, plan_id: plan.id })));
    if (lineError) {
      // Do not leave a half-saved plan behind.
      await supabase.from("plans").delete().eq("id", plan.id);
      throw new Error(tableMissing(lineError) ? MIGRATION_HINT : lineError.message);
    }
  }

  revalidatePath("/settings/plans");
}

async function updatePlanImpl(planId: string, formData: FormData) {
  const supabase = await createClient();
  const { name, platforms, lines, valid_from, valid_to } = readPlanFields(formData);

  const { error } = await supabase
    .from("plans")
    .update({
      name,
      platforms,
      // With no priced lines (an older plan saved without pricing) the stored totals stay.
      ...(lines.length > 0 ? planTotals(lines) : {}),
      valid_from,
      valid_to,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);
  if (error) throw new Error(error.message);

  if (lines.length > 0) {
    const { error: deleteError } = await supabase.from("plan_platforms").delete().eq("plan_id", planId);
    if (deleteError) throw new Error(tableMissing(deleteError) ? MIGRATION_HINT : deleteError.message);

    const { error: lineError } = await supabase
      .from("plan_platforms")
      .insert(lines.map((l) => ({ ...l, plan_id: planId })));
    if (lineError) throw new Error(lineError.message);
  }

  revalidatePath("/settings/plans");
}

async function deletePlanImpl(planId: string, planName: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);

  if (count && count > 0) {
    throw new Error(
      `"${planName}" is assigned to ${count} deal${count === 1 ? "" : "s"} - reassign or clear those before deleting it.`
    );
  }

  const { error } = await supabase.from("plans").delete().eq("id", planId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings/plans");
}

export async function createPlan(formData: FormData): Promise<ActionResult> {
  return runAction(() => createPlanImpl(formData));
}

export async function updatePlan(planId: string, formData: FormData): Promise<ActionResult> {
  return runAction(() => updatePlanImpl(planId, formData));
}

export async function deletePlan(planId: string, planName: string): Promise<ActionResult> {
  return runAction(() => deletePlanImpl(planId, planName));
}
