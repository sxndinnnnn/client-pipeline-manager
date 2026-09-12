import { createClient } from "@/lib/supabase/server";

/** A deal's title is always its plan's name. */
export async function getPlanName(planId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("plans").select("name").eq("id", planId).single();
  if (error || !data) throw new Error("Selected plan not found");
  return data.name;
}
