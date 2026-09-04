import { createClient } from "@/lib/supabase/server";
import type { ChangelogCategory, ChangelogEntry } from "@/types/database";

const categoryEmoji: Record<ChangelogCategory, string> = {
  feature: "✨",
  improvement: "🛠️",
  fix: "🐛",
};

const categoryStyles: Record<ChangelogCategory, string> = {
  feature: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  fix: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  improvement: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const categoryLabel: Record<ChangelogCategory, string> = {
  feature: "Feature",
  fix: "Fix",
  improvement: "Improvement",
};

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(str: string) {
  return str
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
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

export function ReleaseNoteTimeline({
  rows,
  error,
}: {
  rows: ChangelogEntry[];
  error?: string;
}) {
  const grouped = groupByDate(rows);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Release Note</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          What&apos;s shipped in this tool over time.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">Failed to load changelog: {error}</p>}

      {!error && grouped.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Nothing logged yet.
        </div>
      )}

      {!error && grouped.length > 0 && (
        <div className="relative flex flex-col gap-12">
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-[5px] w-px bg-zinc-200 sm:left-40 dark:bg-zinc-800"
          />
          {grouped.map(([date, dateEntries]) => (
            <div key={date} className="relative flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2 sm:w-40 sm:shrink-0 sm:pt-0.5 sm:pr-6">
                <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-900 ring-4 ring-white dark:bg-zinc-100 dark:ring-zinc-950" />
                <span className="text-sm font-semibold whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                  {formatDate(date)}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-6 pl-[1.375rem] sm:pl-0">
                {dateEntries.map((entry) => (
                  <div key={entry.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        <span aria-hidden className="mr-1.5">
                          {categoryEmoji[entry.category]}
                        </span>
                        {titleCase(entry.title)}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[entry.category]}`}
                      >
                        {categoryLabel[entry.category]}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
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

export default async function ReleaseNotePage() {
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("changelog_entries")
    .select("*")
    .order("released_on", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (entries ?? []) as ChangelogEntry[];

  return <ReleaseNoteTimeline rows={rows} error={error?.message} />;
}
