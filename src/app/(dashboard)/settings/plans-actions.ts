"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";
import type { PlanPlatform } from "@/types/database";

const VALID_PLATFORMS: PlanPlatform[] = ["GPS", "TMS", "DVR", "HES", "FMS"];

function parsePlatforms(formData: FormData): PlanPlatform[] {
  return formData
    .getAll("platforms")
    .filter((p): p is string => typeof p === "string")
    .filter((p): p is PlanPlatform => (VALID_PLATFORMS as string[]).includes(p));
}

function parseNumber(raw: FormDataEntryValue | null): number | null {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function createPlan(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Plan name is required");

  const { data, error } = await supabase
    .from("plans")
    .insert({
      name,
      platforms: parsePlatforms(formData),
      amount_usd: parseNumber(formData.get("amount_usd")),
      amount_lkr: parseNumber(formData.get("amount_lkr")),
      vehicle_count: parseNumber(formData.get("vehicle_count")),
      shipment_count: parseNumber(formData.get("shipment_count")),
      valid_from: (formData.get("valid_from") as string) || null,
      valid_to: (formData.get("valid_to") as string) || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    action: "plan.create",
    description: `Created plan "${name}"`,
    entityType: "plan",
    entityId: data.id,
  });

  revalidatePath("/settings/plans");
}

export async function updatePlan(planId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Plan name is required");

  const { error } = await supabase
    .from("plans")
    .update({
      name,
      platforms: parsePlatforms(formData),
      amount_usd: parseNumber(formData.get("amount_usd")),
      amount_lkr: parseNumber(formData.get("amount_lkr")),
      vehicle_count: parseNumber(formData.get("vehicle_count")),
      shipment_count: parseNumber(formData.get("shipment_count")),
      valid_from: (formData.get("valid_from") as string) || null,
      valid_to: (formData.get("valid_to") as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) throw new Error(error.message);

  await logAudit({
    action: "plan.update",
    description: `Updated plan "${name}"`,
    entityType: "plan",
    entityId: planId,
  });

  revalidatePath("/settings/plans");
}

export async function deletePlan(planId: string, planName: string) {
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

  await logAudit({
    action: "plan.delete",
    description: `Deleted plan "${planName}"`,
    entityType: "plan",
    entityId: planId,
  });

  revalidatePath("/settings/plans");
}
