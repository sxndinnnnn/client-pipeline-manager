import { createClient } from "@/lib/supabase/server";
import type { PipelineStage } from "@/types/database";
import { StagesPanel } from "../stages-panel";

export default async function StagesSettingsPage() {
  const supabase = await createClient();
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("sort_order", { ascending: true });

  return <StagesPanel stages={(stages ?? []) as PipelineStage[]} />;
}
