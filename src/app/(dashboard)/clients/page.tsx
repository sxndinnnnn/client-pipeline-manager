import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddClientModal } from "./add-client-modal";
import { PaginationControls } from "./pagination-controls";

const DEFAULT_PAGE_SIZE = 10;

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

  const { data: clients, error, count } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Clients</h1>
        <AddClientModal />
      </div>

      <form method="get" className="flex gap-2">
        <input type="hidden" name="pageSize" value={pageSize} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search Client"
          className="w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Search
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load clients: {error.message}
        </p>
      )}

      {!error && clients && clients.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
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
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{client.name}</h2>
                {client.tags && client.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {client.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
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
