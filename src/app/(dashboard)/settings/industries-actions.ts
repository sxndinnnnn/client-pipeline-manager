"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createIndustry(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Industry name is required");

  const { error } = await supabase
    .from("industries")
    .insert({ name });

  if (error) throw new Error(error.message);

  revalidatePath("/settings/industries");
}

export async function renameIndustry(industryId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Industry name is required");

  const { error } = await supabase.from("industries").update({ name }).eq("id", industryId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings/industries");
}

export async function deleteIndustry(industryId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("industries").delete().eq("id", industryId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings/industries");
}
