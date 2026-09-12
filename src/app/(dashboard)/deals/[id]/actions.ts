"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";
import type { ActivityType } from "@/types/database";

export async function updateDeal(dealId: string, formData: FormData) {
  const supabase = await createClient();

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Deal title is required");

  const valueRaw = formData.get("value") as string;

  const planIdRaw = formData.get("plan_id") as string;

  const { error } = await supabase
    .from("deals")
    .update({
      title,
      plan_id: planIdRaw || null,
      value: valueRaw ? Number(valueRaw) : null,
      source: (formData.get("source") as string) || null,
      expected_close_date: (formData.get("expected_close_date") as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealId);

  if (error) throw new Error(error.message);

  await logAudit({
    action: "deal.update",
    description: `Updated deal "${title}"`,
    entityType: "deal",
    entityId: dealId,
  });

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/pipeline");
}

export async function deleteDeal(dealId: string, dealTitle: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("deals").delete().eq("id", dealId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "deal.delete",
    description: `Deleted deal "${dealTitle}"`,
    entityType: "deal",
    entityId: dealId,
  });

  revalidatePath("/pipeline");
}

export async function addActivity(dealId: string, formData: FormData) {
  const supabase = await createClient();

  const content = (formData.get("content") as string)?.trim();
  if (!content) throw new Error("Activity content is required");

  const type = formData.get("type") as ActivityType;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("activities").insert({
    deal_id: dealId,
    author_id: user?.id ?? null,
    type,
    content,
  });

  if (error) throw new Error(error.message);

  await logAudit({
    action: "deal.activity_add",
    description: `Logged a ${type} on a deal`,
    entityType: "deal",
    entityId: dealId,
  });

  revalidatePath(`/deals/${dealId}`);
}

export async function deleteActivity(dealId: string, activityId: string, type: ActivityType) {
  const supabase = await createClient();

  const { error } = await supabase.from("activities").delete().eq("id", activityId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "deal.activity_delete",
    description: `Deleted a ${type} log from a deal`,
    entityType: "activity",
    entityId: activityId,
  });

  revalidatePath(`/deals/${dealId}`);
}
