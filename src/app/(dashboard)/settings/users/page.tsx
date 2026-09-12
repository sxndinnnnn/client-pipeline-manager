import { createClient } from "@/lib/supabase/server";
import { UsersPanel } from "../users-panel";
import { listUsers, type SettingsUser } from "../users-actions";

export default async function UsersSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let users: SettingsUser[] = [];
  let usersError: string | undefined;
  try {
    users = await listUsers();
  } catch (err) {
    usersError = err instanceof Error ? err.message : "Failed to load users";
  }

  return <UsersPanel users={users} error={usersError} currentUserId={currentUser?.id} />;
}
