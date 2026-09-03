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

  const { error } = await supabase
    .from("deals")
    .update({
      title,
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

export async function addTask(dealId: string, formData: FormData) {
  const supabase = await createClient();

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Task title is required");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      deal_id: dealId,
      assignee_id: user?.id ?? null,
      title,
      due_date: (formData.get("due_date") as string) || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    action: "task.create",
    description: `Added task "${title}"`,
    entityType: "task",
    entityId: data.id,
  });

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/tasks");
}

export async function setTaskStatus(dealId: string, taskId: string, done: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ status: done ? "DONE" : "PENDING" })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  await logAudit({
    action: "task.status_change",
    description: `Marked a task as ${done ? "done" : "pending"}`,
    entityType: "task",
    entityId: taskId,
  });

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/tasks");
}
