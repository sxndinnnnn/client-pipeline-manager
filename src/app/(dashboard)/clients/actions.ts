"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlanName, getPlanPriceSnapshot, MISSING_COLUMN_CODE } from "@/lib/deals";
import { getCurrentUser } from "@/lib/supabase/current-user";

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

const LOGO_BUCKET = "client-logos";

function logoStoragePath(logoUrl: string): string | null {
  const marker = `/${LOGO_BUCKET}/`;
  const idx = logoUrl.indexOf(marker);
  return idx === -1 ? null : logoUrl.slice(idx + marker.length);
}

export async function uploadClientLogo(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No logo file provided");
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${clientId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);

  const { error } = await supabase
    .from("clients")
    .update({ logo_url: publicUrl })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

export async function removeClientLogo(clientId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("clients")
    .select("logo_url")
    .eq("id", clientId)
    .single();

  const { error } = await supabase
    .from("clients")
    .update({ logo_url: null })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  const path = existing?.logo_url ? logoStoragePath(existing.logo_url) : null;
  if (path) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
  }

  revalidatePath(`/clients/${clientId}`);
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Client name is required");

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      industry: (formData.get("industry") as string) || null,
      notes: (formData.get("notes") as string) || null,
      tags: parseTags(formData.get("tags")),
      created_by_email: user?.email ?? null,
      updated_by_email: user?.email ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Client name is required");

  const user = await getCurrentUser();

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      industry: (formData.get("industry") as string) || null,
      notes: (formData.get("notes") as string) || null,
      tags: parseTags(formData.get("tags")),
      updated_by_email: user?.email ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function toggleClientActive(clientId: string, nextActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ is_active: nextActive, updated_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function deleteClient(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  redirect("/clients");
}

export async function addContact(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Contact name is required");

  const { error } = await supabase
    .from("contacts")
    .insert({
      client_id: clientId,
      name,
      role: (formData.get("role") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
    });

  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

export async function updateContact(clientId: string, contactId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Contact name is required");

  const { error } = await supabase
    .from("contacts")
    .update({
      name,
      role: (formData.get("role") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
    })
    .eq("id", contactId);

  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteContact(clientId: string, contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

export async function createDeal(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const planId = (formData.get("plan_id") as string)?.trim();
  if (!planId) throw new Error("Plan is required");
  const title = await getPlanName(planId);

  const { data: leadStage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  const user = await getCurrentUser();

  const valueRaw = formData.get("value") as string;
  const valueUsdRaw = formData.get("value_usd") as string;

  const row = {
    title,
    client_id: clientId,
    stage_id: leadStage?.id ?? null,
    owner_id: user?.id ?? null,
    plan_id: planId,
    value: valueRaw ? Number(valueRaw) : null,
    value_usd: valueUsdRaw ? Number(valueUsdRaw) : null,
  };

  // Freeze the plan price on the deal so later plan edits do not change its gain/loss.
  let { error } = await supabase
    .from("deals")
    .insert({ ...row, ...(await getPlanPriceSnapshot(planId)) });

  // Migration 0138 adds the snapshot columns; until it has been run, insert without them.
  if (error?.code === MISSING_COLUMN_CODE) {
    ({ error } = await supabase.from("deals").insert(row));
  }

  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}?tab=deals`);
}
