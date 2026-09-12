"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";
import type { StageKind } from "@/types/database";

const VALID_KINDS: StageKind[] = ["PENDING", "IN_PROGRESS", "WON", "LOST"];

function parseKind(raw: FormDataEntryValue | null): StageKind {
  return typeof raw === "string" && (VALID_KINDS as string[]).includes(raw)
    ? (raw as StageKind)
    : "IN_PROGRESS";
}

export async function createStage(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Stage name is required");

  const { data: maxRow } = await supabase
    .from("pipeline_stages")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("pipeline_stages")
    .insert({ name, sort_order: nextSortOrder })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    action: "stage.create",
    description: `Created pipeline stage "${name}"`,
    entityType: "pipeline_stage",
    entityId: data.id,
  });

  revalidatePath("/settings");
}

export async function updateStage(stageId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Stage name is required");
  const kind = parseKind(formData.get("kind"));

  const { error } = await supabase
    .from("pipeline_stages")
    .update({ name, kind })
    .eq("id", stageId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "stage.update",
    description: `Updated pipeline stage "${name}" (${kind})`,
    entityType: "pipeline_stage",
    entityId: stageId,
  });

  revalidatePath("/settings");
}

export async function deleteStage(stageId: string, stageName: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", stageId);

  if (count && count > 0) {
    throw new Error(
      `"${stageName}" has ${count} deal${count === 1 ? "" : "s"} in it - move those to another stage before deleting it.`
    );
  }

  const { error } = await supabase.from("pipeline_stages").delete().eq("id", stageId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "stage.delete",
    description: `Deleted pipeline stage "${stageName}"`,
    entityType: "pipeline_stage",
    entityId: stageId,
  });

  revalidatePath("/settings");
}

export async function moveStage(stageId: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: stages, error } = await supabase
    .from("pipeline_stages")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = stages ?? [];
  const index = rows.findIndex((s) => s.id === stageId);
  if (index === -1) return;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) return;

  const a = rows[index];
  const b = rows[swapWith];

  // sort_order has a unique constraint, so a direct two-way swap would
  // collide mid-flight - stage the move through a scratch value that's
  // never assigned to a real stage (createStage only ever hands out >= 0).
  const { error: e1 } = await supabase
    .from("pipeline_stages")
    .update({ sort_order: -1 })
    .eq("id", a.id);
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase
    .from("pipeline_stages")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id);
  if (e2) throw new Error(e2.message);

  const { error: e3 } = await supabase
    .from("pipeline_stages")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id);
  if (e3) throw new Error(e3.message);

  revalidatePath("/settings");
}
