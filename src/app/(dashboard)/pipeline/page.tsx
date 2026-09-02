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
      <h1 className="text-2xl font-semibold text-zinc-900">Pipeline</h1>

      {error && <p className="text-sm text-red-600">Failed to load pipeline: {error.message}</p>}

      {!error && (!stages || stages.length === 0) && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No pipeline stages configured yet. Run the seed migration to add default stages.
        </div>
      )}

      {!error && stages && stages.length > 0 && (
        <PipelineBoard stages={stages} initialDeals={deals ?? []} />
      )}
    </div>
  );
}
