"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";

export async function signIn(_prevState: { error: string | null }, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/clients";

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
