import { createClient } from "@/lib/supabase/server";
import { PaginationControls } from "@/app/(dashboard)/clients/pagination-controls";
import { formatDateTime } from "@/lib/datetime";

const DEFAULT_PAGE_SIZE = 25;

type LogEntry = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  description: string;
  ip_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  created_at: string;
};

function formatLocation(entry: LogEntry) {
  const parts = [entry.city, entry.region, entry.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown";
}

export default async function SystemLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const { page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = Math.max(1, Number(pageSizeParam) || DEFAULT_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  const {
    data: entries,
    error,
    count,
  } = await supabase
    .from("audit_log")
    .select(
      "id, user_id, user_email, action, description, ip_address, city, region, country, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows = (entries ?? []) as LogEntry[];

  const { data: profiles } = await supabase.from("user_profiles").select("id, name");
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  function displayName(entry: LogEntry) {
    return (entry.user_id && nameById.get(entry.user_id)) || entry.user_email || "-";
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-error">
          Failed to load log: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-subtle">
          No activity logged yet.
        </div>
      )}

      {!error && rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-resting">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-subtle">
                    Time
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-subtle">
                    User
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-subtle">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-subtle">
                    Description
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-subtle">
                    IP address
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-subtle">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-subtle">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-foreground">
                      {displayName(entry)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <span className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-muted">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {entry.description}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-subtle">
                      {entry.ip_address ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-subtle">
                      {formatLocation(entry)}
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
