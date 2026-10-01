"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";

const BUCKET = "client-attachments";
const MAX_BYTES = 25 * 1024 * 1024;

// Production masks thrown server-action errors, so these return the message instead.
export type PrepareUploadResult = { path?: string; token?: string; error?: string };
export type AttachmentResult = { error?: string };

function tableMissing(error: { code?: string }): boolean {
  return error.code === "PGRST205" || error.code === "42P01";
}

const MIGRATION_HINT =
  "Attachments aren't set up yet. Run migration 0141_client_attachments.sql in the Supabase SQL Editor first.";

/** Step 1: mint a one-time upload token for a new file in this client's folder. */
export async function prepareUpload(
  clientId: string,
  fileName: string,
  sizeBytes: number
): Promise<PrepareUploadResult> {
  if (sizeBytes > MAX_BYTES) return { error: "Files can be at most 25 MB." };

  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-120) || "file";
  const path = `${clientId}/${crypto.randomUUID()}-${safeName}`;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return {
      error: /bucket not found/i.test(error?.message ?? "")
        ? MIGRATION_HINT
        : (error?.message ?? "Could not start the upload."),
    };
  }
  return { path, token: data.token };
}

/** Step 3: after the browser has uploaded the file, record it against the client. */
export async function saveAttachment(
  clientId: string,
  file: { path: string; name: string; size: number; type: string }
): Promise<AttachmentResult> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { error } = await supabase.from("client_attachments").insert({
    client_id: clientId,
    file_name: file.name,
    storage_path: file.path,
    size_bytes: file.size,
    content_type: file.type || null,
    uploaded_by_email: user?.email ?? null,
  });
  if (error) return { error: tableMissing(error) ? MIGRATION_HINT : error.message };

  revalidatePath(`/clients/${clientId}`);
  return {};
}

export async function deleteAttachment(
  clientId: string,
  attachmentId: string
): Promise<AttachmentResult> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("client_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .eq("client_id", clientId)
    .single();
  if (!row) return { error: "Attachment not found." };

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([row.storage_path]);
  if (storageError) return { error: storageError.message };

  const { error } = await supabase.from("client_attachments").delete().eq("id", attachmentId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return {};
}
