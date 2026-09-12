import { createClient } from "@/lib/supabase/server";

/** Profile name for a user, falling back to their email when no name is set. */
export async function getUserDisplayName(
  userId: string | null | undefined,
  fallbackEmail: string | null | undefined
): Promise<string> {
  if (userId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle();
    if (data?.name) return data.name;
  }
  return fallbackEmail ?? "A user";
}
