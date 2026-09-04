"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";

// Only ever redirect within the app after login. redirectTo comes from a
// client-controlled query param, so an unvalidated value here would be an
// open redirect - an attacker's link could bounce a freshly-authenticated
// browser off to an external phishing page right after real credentials
// were entered.
function safeRedirectPath(path: string | null): string {
  if (!path) return "/dashboard";
  if (!path.startsWith("/")) return "/dashboard";
  if (path.startsWith("//") || path.startsWith("/\\")) return "/dashboard";
  if (path.includes("://")) return "/dashboard";
  return path;
}

export async function signIn(_prevState: { error: string | null }, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = safeRedirectPath(formData.get("redirectTo") as string | null);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  await logAudit({
    action: "login",
    description: `${email} signed in`,
    userId: data.user?.id ?? null,
    userEmail: data.user?.email ?? email,
  });

  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await logAudit({
    action: "logout",
    description: `${user?.email ?? "A user"} signed out`,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
  });

  await supabase.auth.signOut();
  redirect("/login");
}
