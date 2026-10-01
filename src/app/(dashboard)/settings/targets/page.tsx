import { createClient } from "@/lib/supabase/server";
import type { SalesTarget } from "@/types/database";
import { TargetsPanel } from "../targets-panel";

export default async function TargetsSettingsPage() {
  const supabase = await createClient();
  const { data: targets } = await supabase
    .from("sales_targets")
    .select("*")
    .order("year", { ascending: false });

  return <TargetsPanel targets={(targets ?? []) as SalesTarget[]} />;
}
