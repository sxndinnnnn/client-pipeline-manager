import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClientRecord } from "./actions";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clients").select("*").order("name", { ascending: true });
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: clients, error } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            + Add client
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
            <form action={createClientRecord} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Name *</label>
                <input
                  name="name"
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Industry</label>
                <input
                  name="industry"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Tags (comma-separated)
                </label>
                <input
                  name="tags"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="mt-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Create client
              </button>
            </form>
          </div>
        </details>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search clients by name..."
          className="w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600">Failed to load clients: {error.message}</p>}

      {!error && clients && clients.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          {q ? `No clients match "${q}".` : "No clients yet. Add your first client to get started."}
        </div>
      )}

      {!error && clients && clients.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow"
            >
              <h2 className="font-medium text-zinc-900">{client.name}</h2>
              {client.industry && <p className="mt-1 text-sm text-zinc-500">{client.industry}</p>}
              {client.tags && client.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {client.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
