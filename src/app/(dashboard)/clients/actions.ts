"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Client name is required");

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      industry: (formData.get("industry") as string) || null,
      notes: (formData.get("notes") as string) || null,
      tags: parseTags(formData.get("tags")),
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

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      industry: (formData.get("industry") as string) || null,
      notes: (formData.get("notes") as string) || null,
      tags: parseTags(formData.get("tags")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function addContact(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Contact name is required");

  const { error } = await supabase.from("contacts").insert({
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

  revalidatePath(`/clients/${clientId}`);
  redirect(`/deals/${data.id}`);
}
