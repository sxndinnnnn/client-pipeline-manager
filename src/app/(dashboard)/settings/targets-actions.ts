"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Production builds replace thrown server-action errors with a generic masked message,
// so these actions return the error text for the form to display instead.
export type TargetResult = { error?: string };

// PGRST205 / 42P01: the table does not exist, i.e. migration 0112 has not been run yet.
function describeDbError(error: { code?: string; message: string }): string {
  if (error.code === "PGRST205" || error.code === "42P01") {
    return "The sales_targets table doesn't exist yet. Run migration 0112_dashboard_kpi_schema.sql in the Supabase SQL Editor first.";
  }
  return error.message;
}

export async function saveTarget(formData: FormData): Promise<TargetResult> {
  const supabase = await createClient();

  const year = Number(formData.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: "Enter a valid year" };
  }
  const amount = Number(formData.get("amount_lkr"));
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Target must be a positive amount" };
  }

  const { error } = await supabase
    .from("sales_targets")
    .upsert({ year, amount_lkr: amount, updated_at: new Date().toISOString() });
  if (error) return { error: describeDbError(error) };

  revalidatePath("/settings/targets");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteTarget(year: number): Promise<TargetResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("sales_targets").delete().eq("year", year);
  if (error) return { error: describeDbError(error) };

  revalidatePath("/settings/targets");
  revalidatePath("/dashboard");
  return {};
}
