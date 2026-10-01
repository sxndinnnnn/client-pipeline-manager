"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/current-user";

export type SettingsUser = {
  id: string;
  email: string | null;
  name: string | null;
  position: string | null;
};

// Production builds replace thrown server-action errors with a generic masked message,
// so the mutating actions below return the error text for the form to display.
export type UserActionResult = { error?: string };

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function listUsers(): Promise<SettingsUser[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(error.message);

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("user_profiles").select("*");
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Oldest login first, so the list order stays stable.
  return [...data.users]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((u) => ({
      id: u.id,
      email: u.email ?? null,
      name: profileById.get(u.id)?.name ?? null,
      position: profileById.get(u.id)?.position ?? null,
    }));
}

/** Creates a login with the given password (no email round trip) plus its profile row. */
export async function addUser(formData: FormData): Promise<UserActionResult> {
  const email = text(formData, "email").toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  const name = text(formData, "name") || null;
  const position = text(formData, "position") || null;

  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address" };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) return { error: error?.message ?? "Failed to create user" };

    const { error: profileError } = await admin
      .from("user_profiles")
      .upsert({ id: data.user.id, email, name, position, updated_at: new Date().toISOString() });
    if (profileError) {
      return { error: `User created, but saving the profile failed: ${profileError.message}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create user" };
  }

  revalidatePath("/settings/users");
  return {};
}

/** Updates name/position, and the login email and/or password when they are provided. */
export async function updateUser(userId: string, formData: FormData): Promise<UserActionResult> {
  const email = text(formData, "email").toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  const name = text(formData, "name") || null;
  const position = text(formData, "position") || null;

  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address" };
  if (password && password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }

  try {
    const admin = createAdminClient();

    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
      ...(password ? { password } : {}),
    });
    if (authError) return { error: authError.message };

    const { error: profileError } = await admin
      .from("user_profiles")
      .upsert({ id: userId, email, name, position, updated_at: new Date().toISOString() });
    if (profileError) return { error: profileError.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update user" };
  }

  revalidatePath("/settings/users");
  return {};
}

export async function removeUser(userId: string): Promise<UserActionResult> {
  const current = await getCurrentUser();
  if (current?.id === userId) return { error: "You can't remove your own account" };

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      // deals.owner_id and activities.author_id reference the login without a cascade,
      // so a user who owns deals or logged activities cannot be deleted.
      const blocked = /database error/i.test(error.message);
      return {
        error: blocked
          ? "This user still owns deals or logged activities, so their login can't be removed."
          : error.message,
      };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove user" };
  }

  revalidatePath("/settings/users");
  return {};
}
