import { createClient } from "@/lib/supabase/server";
import type { Industry } from "@/types/database";
import { IndustriesPanel } from "../industries-panel";

export default async function IndustriesSettingsPage() {
  const supabase = await createClient();
  const { data: industries } = await supabase
    .from("industries")
    .select("*")
    .order("name", { ascending: true });

  return <IndustriesPanel industries={(industries ?? []) as Industry[]} />;
}
