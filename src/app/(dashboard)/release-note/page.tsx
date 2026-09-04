import { createClient } from "@/lib/supabase/server";
import type { ChangelogCategory, ChangelogEntry } from "@/types/database";

const categoryStyles: Record<ChangelogCategory, string> = {
  feature: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  fix: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  improvement: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: "long",
  });
}

function groupByDate(entries: ChangelogEntry[]) {
  const groups = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.released_on) ?? [];
    list.push(entry);
    groups.set(entry.released_on, list);
  }
  return Array.from(groups.entries());
}

export default async function ReleaseNotePage() {
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("changelog_entries")
    .select("*")
    .order("released_on", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (entries ?? []) as ChangelogEntry[];
  const grouped = groupByDate(rows);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Release Note</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          What&apos;s shipped in this tool over time.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load changelog: {error.message}
        </p>
      )}

      {!error && grouped.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Nothing logged yet.
        </div>
      )}

      {!error && grouped.length > 0 && (
        <div className="flex flex-col gap-8">
          {grouped.map(([date, dateEntries]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {formatDate(date)}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {dateEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[entry.category]}`}
                      >
                        {entry.category}
                      </span>
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {entry.title}
                      </h3>
                    </div>
                    {entry.description && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {entry.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
