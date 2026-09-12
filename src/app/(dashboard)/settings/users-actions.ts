"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit-log";
import { getUserDisplayName } from "@/lib/user-profile";

export type SettingsUser = {
  id: string;
  email: string | null;
  name: string | null;
  position: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export async function listUsers(): Promise<SettingsUser[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(error.message);

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("user_profiles").select("*");
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? null,
      name: profileById.get(u.id)?.name ?? null,
      position: profileById.get(u.id)?.position ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function updateUserProfile(userId: string, email: string | null, formData: FormData) {
  const supabase = await createClient();

  const name = ((formData.get("name") as string) ?? "").trim() || null;
  const position = ((formData.get("position") as string) ?? "").trim() || null;

  const { error } = await supabase
    .from("user_profiles")
    .upsert({ id: userId, email, name, position, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);

  await logAudit({
    action: "user.profile_update",
    description: `Updated profile for ${name ?? email ?? userId}`,
    entityType: "user_profile",
    entityId: userId,
  });

  revalidatePath("/settings/users");
}

export async function removeUser(userId: string, userEmail: string) {
  const displayName = await getUserDisplayName(userId, userEmail);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "user.remove",
    description: `Removed user ${displayName}`,
  });

  revalidatePath("/settings/users");
}
