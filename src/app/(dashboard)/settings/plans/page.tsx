import { createClient } from "@/lib/supabase/server";
import type { Plan, PlanPlatformLine } from "@/types/database";
import { PlansPanel } from "../plans-panel";

export default async function PlansSettingsPage() {
  const supabase = await createClient();
  const [{ data: plans }, { data: lines }] = await Promise.all([
    supabase.from("plans").select("*").order("created_at", { ascending: false }),
    // plan_platforms comes from migration 0142; until then this errors and plans show no breakdown.
    supabase.from("plan_platforms").select("*"),
  ]);

  const linesByPlan: Record<string, PlanPlatformLine[]> = {};
  for (const line of (lines ?? []) as PlanPlatformLine[]) {
    (linesByPlan[line.plan_id] ??= []).push(line);
  }

  return <PlansPanel plans={(plans ?? []) as Plan[]} linesByPlan={linesByPlan} />;
}
