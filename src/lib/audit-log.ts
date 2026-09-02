import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type AuditParams = {
  action: string;
  description: string;
  entityType?: string;
  entityId?: string;
  /** Pass explicitly for login/logout, where the session is mid-transition. */
  userId?: string | null;
  userEmail?: string | null;
};

export async function logAudit(params: AuditParams) {
  const supabase = await createClient();

  let userId = params.userId;
  let userEmail = params.userEmail;

  if (userId === undefined) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    userEmail = user?.email ?? null;
  }

  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : h.get("x-real-ip");
  const city = h.get("x-vercel-ip-city");

  const { error } = await supabase.from("audit_log").insert({
    user_id: userId ?? null,
    user_email: userEmail ?? null,
    action: params.action,
    description: params.description,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    ip_address: ip ?? null,
    city: city ? decodeURIComponent(city) : null,
    region: h.get("x-vercel-ip-country-region"),
    country: h.get("x-vercel-ip-country"),
    user_agent: h.get("user-agent"),
  });

  // Never let audit logging break the action it's attached to.
  if (error) {
    console.error("Failed to write audit log:", error.message);
  }
}
