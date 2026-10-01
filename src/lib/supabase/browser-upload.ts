import { createClient } from "@supabase/supabase-js";

export const ATTACHMENT_BUCKET = "client-attachments";
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/**
 * Uploads a file straight from the browser to Supabase Storage using a signed upload
 * token minted by a server action. The browser never talks to the database, and Vercel
 * serverless functions cap request bodies at about 4.5 MB, so files must not go through
 * a server action. The anon key is public by design; the signed token is what authorises
 * this single upload.
 */
export async function uploadToSignedUrl(
  path: string,
  token: string,
  file: File
): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .uploadToSignedUrl(path, token, file, { contentType: file.type || undefined });
  return error ? error.message : null;
}
