import { createClient } from "@/lib/supabase/server";
import { PaginationControls } from "@/app/(dashboard)/clients/pagination-controls";

const DEFAULT_PAGE_SIZE = 25;

type LogEntry = {
  id: string;
  user_email: string | null;
  action: string;
  description: string;
  ip_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  created_at: string;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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
    .select("id, user_email, action, description, ip_address, city, region, country, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows = (entries ?? []) as LogEntry[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">System Log</h1>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load log: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No activity logged yet.
        </div>
      )}

      {!error && rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    Time
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    User
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    Description
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    IP address
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-900 dark:text-zinc-100">
                      {entry.user_email ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                      {entry.description}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {entry.ip_address ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-500 dark:text-zinc-400">
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
