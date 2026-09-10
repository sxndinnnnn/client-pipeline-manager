import { createClient } from "@/lib/supabase/server";
import type { ChangelogCategory, ChangelogEntry } from "@/types/database";

const categoryEmoji: Record<ChangelogCategory, string> = {
  feature: "✨",
  improvement: "🛠️",
  fix: "🐛",
};

const categoryStyles: Record<ChangelogCategory, string> = {
  feature: "bg-primary/15 text-primary",
  fix: "bg-warning/15 text-warning",
  improvement: "bg-success/15 text-success",
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
      {error && <p className="text-sm text-error">Failed to load changelog: {error}</p>}

      {!error && grouped.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-subtle">
          Nothing logged yet.
        </div>
      )}

      {!error && grouped.length > 0 && (
        <div className="relative flex flex-col gap-12">
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-[5px] w-px bg-border sm:left-40"
          />
          {grouped.map(([date, dateEntries]) => (
            <div key={date} className="relative flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2 sm:w-40 sm:shrink-0 sm:pt-0.5 sm:pr-6">
                <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full bg-foreground ring-4 ring-background" />
                <span className="text-sm font-semibold whitespace-nowrap text-subtle">
                  {formatDate(date)}
                </span>
              </div>

              <div className="flex flex-1 flex-col divide-y divide-border pl-[1.375rem] sm:pl-0">
                {dateEntries.map((entry) => (
                  <div key={entry.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">
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
                      <p className="mt-1.5 text-sm text-muted">
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
