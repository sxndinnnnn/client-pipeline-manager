"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";

export async function createIndustry(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Industry name is required");

  const { data, error } = await supabase
    .from("industries")
    .insert({ name })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    action: "industry.create",
    description: `Created industry "${name}"`,
    entityType: "industry",
    entityId: data.id,
  });

  revalidatePath("/settings/industries");
}

export async function renameIndustry(industryId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Industry name is required");

  const { error } = await supabase.from("industries").update({ name }).eq("id", industryId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "industry.update",
    description: `Renamed industry to "${name}"`,
    entityType: "industry",
    entityId: industryId,
  });

  revalidatePath("/settings/industries");
}

export async function deleteIndustry(industryId: string, industryName: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("industries").delete().eq("id", industryId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "industry.delete",
    description: `Deleted industry "${industryName}"`,
    entityType: "industry",
    entityId: industryId,
  });

  revalidatePath("/settings/industries");
}
