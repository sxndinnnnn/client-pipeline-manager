import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | undefined };

/**
 * The signed-in user, derived from the session JWT's claims. Unlike `auth.getUser()`
 * this verifies the token locally instead of calling Supabase Auth over the network, and
 * `cache()` dedupes it to one lookup per request. RLS still enforces access in the DB.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return null;
  return { id: data.claims.sub, email: data.claims.email as string | undefined };
});
