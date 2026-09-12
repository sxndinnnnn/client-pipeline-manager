import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for Supabase Auth admin operations (listing/inviting/
// removing users). Bypasses RLS entirely - never import this into a "use
// client" component or return it from anything client-reachable. Only call
// it from Server Actions/Server Components under src/app/(dashboard)/settings.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (Supabase Dashboard > Project Settings > API > service_role secret) to enable user management."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
