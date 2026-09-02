"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function moveDeal(dealId: string, stageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.rpc("move_deal_stage", {
    p_deal_id: dealId,
    p_stage_id: stageId,
    p_actor_id: user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/pipeline");
  revalidatePath(`/deals/${dealId}`);
}
