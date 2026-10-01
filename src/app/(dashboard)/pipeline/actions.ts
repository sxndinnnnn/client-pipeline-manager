"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";

export async function moveDeal(dealId: string, stageId: string, lostReason?: string) {
  const supabase = await createClient();

  let { error } = await supabase.rpc("move_deal_stage", {
    p_deal_id: dealId,
    p_stage_id: stageId,
    ...(lostReason ? { p_lost_reason: lostReason } : {}),
  });

  // Migration 0112 adds the p_lost_reason argument; until it has been run, retry
  // without it so moving deals keeps working.
  if (error && lostReason && error.code === "PGRST202") {
    ({ error } = await supabase.rpc("move_deal_stage", {
      p_deal_id: dealId,
      p_stage_id: stageId,
    }));
  }

  if (error) throw new Error(error.message);

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("name")
    .eq("id", stageId)
    .single();

  await logAudit({
    action: "deal.stage_move",
    description: `Moved a deal to "${stage?.name ?? "a new stage"}"${lostReason ? ` (reason: ${lostReason})` : ""}`,
    entityType: "deal",
    entityId: dealId,
  });

  revalidatePath("/pipeline");
  revalidatePath(`/deals/${dealId}`);
}
