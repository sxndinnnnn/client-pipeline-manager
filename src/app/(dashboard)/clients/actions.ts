"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";

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

  await logAudit({
    action: "client.logo_upload",
    description: "Uploaded a client logo",
    entityType: "client",
    entityId: clientId,
  });

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

  await logAudit({
    action: "client.logo_remove",
    description: "Removed a client logo",
    entityType: "client",
    entityId: clientId,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Client name is required");

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  await logAudit({
    action: "client.create",
    description: `Created client "${name}"`,
    entityType: "client",
    entityId: data.id,
  });

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Client name is required");

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  await logAudit({
    action: "client.update",
    description: `Updated client "${name}"`,
    entityType: "client",
    entityId: clientId,
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function addContact(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Contact name is required");

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      client_id: clientId,
      name,
      role: (formData.get("role") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    action: "contact.create",
    description: `Added contact "${name}"`,
    entityType: "contact",
    entityId: data.id,
  });

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

  await logAudit({
    action: "contact.update",
    description: `Updated contact "${name}"`,
    entityType: "contact",
    entityId: contactId,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteContact(clientId: string, contactId: string, contactName: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "contact.delete",
    description: `Deleted contact "${contactName}"`,
    entityType: "contact",
    entityId: contactId,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function createDeal(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Deal title is required");

  const { data: leadStage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const valueRaw = formData.get("value") as string;

  const { data, error } = await supabase
    .from("deals")
    .insert({
      title,
      client_id: clientId,
      stage_id: leadStage?.id ?? null,
      owner_id: user?.id ?? null,
      value: valueRaw ? Number(valueRaw) : null,
      source: (formData.get("source") as string) || null,
      expected_close_date: (formData.get("expected_close_date") as string) || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    action: "deal.create",
    description: `Created deal "${title}"`,
    entityType: "deal",
    entityId: data.id,
  });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}?tab=deals`);
}
