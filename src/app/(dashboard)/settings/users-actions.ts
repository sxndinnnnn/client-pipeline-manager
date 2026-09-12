"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit-log";

export type SettingsUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export async function listUsers(): Promise<SettingsUser[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(error.message);

  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function inviteUser(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  if (!email) throw new Error("Email is required");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "user.invite",
    description: `Invited user ${email}`,
  });

  revalidatePath("/settings");
}

export async function removeUser(userId: string, userEmail: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "user.remove",
    description: `Removed user ${userEmail}`,
  });

  revalidatePath("/settings");
}
