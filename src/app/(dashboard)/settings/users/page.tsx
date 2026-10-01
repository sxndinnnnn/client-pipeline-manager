import { UsersPanel } from "../users-panel";
import { listUsers, type SettingsUser } from "../users-actions";
import { getCurrentUser } from "@/lib/supabase/current-user";

export default async function UsersSettingsPage() {
  const currentUser = await getCurrentUser();

  let users: SettingsUser[] = [];
  let usersError: string | undefined;
  try {
    users = await listUsers();
  } catch (err) {
    usersError = err instanceof Error ? err.message : "Failed to load users";
  }

  return <UsersPanel users={users} error={usersError} currentUserId={currentUser?.id} />;
}
