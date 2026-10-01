"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";

export async function saveTarget(formData: FormData) {
  const supabase = await createClient();

  const year = Number(formData.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Enter a valid year");
  }
  const amount = Number(formData.get("amount_lkr"));
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Target must be a positive amount");
  }

  const { error } = await supabase
    .from("sales_targets")
    .upsert({ year, amount_lkr: amount, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);

  await logAudit({
    action: "target.save",
    description: `Set the ${year} sales target to LKR ${amount.toLocaleString()}`,
    entityType: "sales_target",
    entityId: String(year),
  });

  revalidatePath("/settings/targets");
  revalidatePath("/dashboard");
}

export async function deleteTarget(year: number) {
  const supabase = await createClient();

  const { error } = await supabase.from("sales_targets").delete().eq("year", year);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "target.delete",
    description: `Removed the ${year} sales target`,
    entityType: "sales_target",
    entityId: String(year),
  });

  revalidatePath("/settings/targets");
  revalidatePath("/dashboard");
}
