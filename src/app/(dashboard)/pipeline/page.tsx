import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "./board";

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data: stages, error: stagesError }, { data: deals, error: dealsError }] =
    await Promise.all([
      supabase.from("pipeline_stages").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("deals")
        .select("*, clients(name)")
        .order("created_at", { ascending: false }),
    ]);

  const error = stagesError || dealsError;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-error">
          Failed to load pipeline: {error.message}
        </p>
      )}

      {!error && (!stages || stages.length === 0) && (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-subtle">
          No pipeline stages configured yet. Run the seed migration to add default stages.
        </div>
      )}

      {!error && stages && stages.length > 0 && (
        <PipelineBoard stages={stages} initialDeals={deals ?? []} />
      )}
    </div>
  );
}
