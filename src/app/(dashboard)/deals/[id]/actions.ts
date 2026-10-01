"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlanName } from "@/lib/deals";
import type { ActivityType } from "@/types/database";
import { LOGGED_ACTIVITY_TYPES } from "@/lib/activities";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { parseColomboInput } from "@/lib/datetime";

// Returns the error text instead of throwing: production masks thrown server-action
// errors, and the edit form needs to show validation messages.
export type UpdateDealResult = { error?: string };

export async function updateDeal(dealId: string, formData: FormData): Promise<UpdateDealResult> {
  const supabase = await createClient();

  const planId = (formData.get("plan_id") as string)?.trim();
  if (!planId) return { error: "Plan is required" };
  const title = await getPlanName(planId);

  const valueRaw = formData.get("value") as string;

  const update: Record<string, unknown> = {
    title,
    plan_id: planId,
    value: valueRaw ? Number(valueRaw) : null,
    updated_at: new Date().toISOString(),
  };

  // Created / Closed At are only touched when the form sends them (the deal page's
  // simpler form does not), and are entered as Colombo local time.
  let createdAt: string | null = null;
  let closedAt: string | null = null;

  const createdRaw = formData.get("created_at");
  if (typeof createdRaw === "string") {
    createdAt = parseColomboInput(createdRaw);
    if (!createdAt) return { error: "Enter a valid created date" };
    update.created_at = createdAt;
  }

  const closedRaw = formData.get("closed_at");
  if (typeof closedRaw === "string") {
    closedAt = parseColomboInput(closedRaw);
    if (!closedAt) return { error: "Enter a valid closed date" };
    update.closed_at = closedAt;
  }

  if (createdAt && closedAt && new Date(closedAt) < new Date(createdAt)) {
    return { error: "Closed At can't be earlier than the created date" };
  }

  const { error } = await supabase.from("deals").update(update).eq("id", dealId);
  if (error) return { error: error.message };

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/pipeline");
  return {};
}

export async function deleteDeal(dealId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("deals").delete().eq("id", dealId);
  if (error) throw new Error(error.message);

  revalidatePath("/pipeline");
}

export async function addActivity(dealId: string, formData: FormData) {
  const supabase = await createClient();

  const content = (formData.get("content") as string)?.trim();
  if (!content) throw new Error("Activity content is required");

  const type = formData.get("type") as ActivityType;
  if (!(LOGGED_ACTIVITY_TYPES as readonly string[]).includes(type)) {
    throw new Error("Choose call, email or meeting");
  }

  const user = await getCurrentUser();

  const { error } = await supabase.from("activities").insert({
    deal_id: dealId,
    author_id: user?.id ?? null,
    type,
    content,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/deals/${dealId}`);
}

export async function deleteActivity(dealId: string, activityId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("activities").delete().eq("id", activityId);
  if (error) throw new Error(error.message);

  revalidatePath(`/deals/${dealId}`);
}
