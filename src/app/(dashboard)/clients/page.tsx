import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddClientModal } from "./add-client-modal";
import { PaginationControls } from "./pagination-controls";
import type { Industry } from "@/types/database";

const DEFAULT_PAGE_SIZE = 50;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const { q, page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = Math.max(1, Number(pageSizeParam) || DEFAULT_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);
  if (q) query = query.ilike("name", `%${q}%`);

  const [{ data: clients, error, count }, { data: industries }] = await Promise.all([
    query,
    supabase.from("industries").select("*").order("name", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <form method="get" className="flex min-w-0 flex-1 gap-2 sm:flex-initial">
          <input type="hidden" name="pageSize" value={pageSize} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search Client"
            className="w-full max-w-sm rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-sunken"
          >
            Search
          </button>
        </form>
        <AddClientModal industries={(industries ?? []) as Industry[]} />
      </div>

      {error && (
        <p className="text-sm text-error">
          Failed to load clients: {error.message}
        </p>
      )}

      {!error && clients && clients.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-subtle">
          {q ? `No clients match "${q}".` : "No clients yet. Add your first client to get started."}
        </div>
      )}

      {!error && clients && clients.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="rounded-lg border border-border bg-surface p-4 shadow-resting transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-raised"
              >
                <h2 className="font-medium text-foreground">{client.name}</h2>
                {client.tags && client.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {client.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-border px-2 py-0.5 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>

          <PaginationControls total={count ?? 0} page={page} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
