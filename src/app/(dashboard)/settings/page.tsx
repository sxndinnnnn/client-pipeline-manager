import { createClient } from "@/lib/supabase/server";
import { ClientTabs } from "@/app/(dashboard)/clients/[id]/client-tabs";
import type { Industry, PipelineStage, Plan } from "@/types/database";
import { PlansPanel } from "./plans-panel";
import { IndustriesPanel } from "./industries-panel";
import { StagesPanel } from "./stages-panel";
import { UsersPanel } from "./users-panel";
import { listUsers, type SettingsUser } from "./users-actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();

  const [
    { data: plans },
    { data: industries },
    { data: stages },
    {
      data: { user: currentUser },
    },
  ] = await Promise.all([
    supabase.from("plans").select("*").order("created_at", { ascending: false }),
    supabase.from("industries").select("*").order("name", { ascending: true }),
    supabase.from("pipeline_stages").select("*").order("sort_order", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  let users: SettingsUser[] = [];
  let usersError: string | undefined;
  try {
    users = await listUsers();
  } catch (err) {
    usersError = err instanceof Error ? err.message : "Failed to load users";
  }

  return (
    <ClientTabs
      defaultTab={tab}
      tabs={[
        { key: "plans", label: "Plans", content: <PlansPanel plans={(plans ?? []) as Plan[]} /> },
        {
          key: "industries",
          label: "Industries",
          content: <IndustriesPanel industries={(industries ?? []) as Industry[]} />,
        },
        {
          key: "stages",
          label: "Pipeline Stages",
          content: <StagesPanel stages={(stages ?? []) as PipelineStage[]} />,
        },
        {
          key: "users",
          label: "Users",
          content: (
            <UsersPanel users={users} error={usersError} currentUserId={currentUser?.id} />
          ),
        },
      ]}
    />
  );
}
