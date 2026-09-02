"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit-log";
import type { ChangelogCategory } from "@/types/database";

export async function addChangelogEntry(formData: FormData) {
  const supabase = await createClient();

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title is required");

  const category = (formData.get("category") as ChangelogCategory) || "feature";

  const { data, error } = await supabase
    .from("changelog_entries")
    .insert({
      title,
      description: (formData.get("description") as string) || null,
      category,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({
    action: "changelog.create",
    description: `Added changelog entry "${title}"`,
    entityType: "changelog_entry",
    entityId: data.id,
  });

  revalidatePath("/changelog");
}
