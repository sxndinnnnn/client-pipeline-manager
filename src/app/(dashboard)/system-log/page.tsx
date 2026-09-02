import { createClient } from "@/lib/supabase/server";

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

export default async function SystemLogPage() {
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("audit_log")
    .select("id, user_email, action, description, ip_address, city, region, country, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (entries ?? []) as LogEntry[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">System Log</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Every action taken in this workspace, with the IP address and location it came
          from. Showing the most recent {rows.length} entries.
        </p>
      </div>

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
      )}
    </div>
  );
}
