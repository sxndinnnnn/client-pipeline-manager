import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddClientModal } from "./add-client-modal";
import { PaginationControls } from "./pagination-controls";
import type { Industry } from "@/types/database";

const DEFAULT_PAGE_SIZE = 50;

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function countByClient(rows: { client_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.client_id, (counts.get(row.client_id) ?? 0) + 1);
  return counts;
}

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

  const clientIds = (clients ?? []).map((c) => c.id);

  const [{ data: contactRows }, { data: dealRows }] = await Promise.all([
    clientIds.length > 0
      ? supabase.from("contacts").select("client_id").in("client_id", clientIds)
      : Promise.resolve({ data: [] as { client_id: string }[] }),
    clientIds.length > 0
      ? supabase.from("deals").select("client_id, status").in("client_id", clientIds)
      : Promise.resolve({ data: [] as { client_id: string; status: string }[] }),
  ]);

  const contactCountByClient = countByClient(contactRows ?? []);
  const dealCountByClient = countByClient(dealRows ?? []);
  const openCountByClient = countByClient((dealRows ?? []).filter((d) => d.status === "OPEN"));
  const wonCountByClient = countByClient((dealRows ?? []).filter((d) => d.status === "WON"));
  const lostCountByClient = countByClient((dealRows ?? []).filter((d) => d.status === "LOST"));

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
          <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-resting">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                    Client
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                    Industry
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                    Contacts
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                    Deals
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                    Open Deals
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                    Won Deals
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                    Lost Deals
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-surface-sunken">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-sunken text-xs font-bold text-foreground">
                          {client.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={client.logo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials(client.name)
                          )}
                        </div>
                        <span className="font-medium text-foreground">{client.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{client.industry ?? "-"}</td>
                    <td className="px-4 py-3 text-muted">
                      {contactCountByClient.get(client.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-muted">{dealCountByClient.get(client.id) ?? 0}</td>
                    <td className="px-4 py-3 text-muted">{openCountByClient.get(client.id) ?? 0}</td>
                    <td className="px-4 py-3 text-muted">{wonCountByClient.get(client.id) ?? 0}</td>
                    <td className="px-4 py-3 text-muted">{lostCountByClient.get(client.id) ?? 0}</td>
                    <td className="px-4 py-3">
                      {client.is_active ? (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-muted">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls total={count ?? 0} page={page} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
