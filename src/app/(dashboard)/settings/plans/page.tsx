import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/types/database";
import { PlansPanel } from "../plans-panel";

export default async function PlansSettingsPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .order("created_at", { ascending: false });

  return <PlansPanel plans={(plans ?? []) as Plan[]} />;
}
