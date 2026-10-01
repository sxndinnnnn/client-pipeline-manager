"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";

async function createIndustryImpl(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Industry name is required");

  const { error } = await supabase
    .from("industries")
    .insert({ name });

  if (error) throw new Error(error.message);

  revalidatePath("/settings/industries");
}

async function renameIndustryImpl(industryId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Industry name is required");

  const { error } = await supabase.from("industries").update({ name }).eq("id", industryId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings/industries");
}

async function deleteIndustryImpl(industryId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("industries").delete().eq("id", industryId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings/industries");
}

export async function createIndustry(formData: FormData): Promise<ActionResult> {
  return runAction(() => createIndustryImpl(formData));
}

export async function renameIndustry(industryId: string, formData: FormData): Promise<ActionResult> {
  return runAction(() => renameIndustryImpl(industryId, formData));
}

export async function deleteIndustry(industryId: string): Promise<ActionResult> {
  return runAction(() => deleteIndustryImpl(industryId));
}
