import { createClient } from "@/lib/supabase/server";
import type { ChangelogCategory, ChangelogEntry } from "@/types/database";
import { addChangelogEntry } from "./actions";

const categoryStyles: Record<ChangelogCategory, string> = {
  feature: "bg-blue-100 text-blue-700",
  fix: "bg-amber-100 text-amber-700",
  improvement: "bg-green-100 text-green-700",
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

export default async function ChangelogPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Changelog</h1>
          <p className="mt-1 text-sm text-zinc-500">What&apos;s shipped in this tool over time.</p>
        </div>
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            + Add entry
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
            <form action={addChangelogEntry} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Title *</label>
                <input
                  name="title"
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Category</label>
                <select
                  name="category"
                  defaultValue="feature"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                >
                  <option value="feature">Feature</option>
                  <option value="improvement">Improvement</option>
                  <option value="fix">Fix</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="mt-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Add entry
              </button>
            </form>
          </div>
        </details>
      </div>

      {error && <p className="text-sm text-red-600">Failed to load changelog: {error.message}</p>}

      {!error && grouped.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          Nothing logged yet.
        </div>
      )}

      {!error && grouped.length > 0 && (
        <div className="flex flex-col gap-8">
          {grouped.map(([date, dateEntries]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-zinc-500">{formatDate(date)}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {dateEntries.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[entry.category]}`}
                      >
                        {entry.category}
                      </span>
                      <h3 className="text-sm font-medium text-zinc-900">{entry.title}</h3>
                    </div>
                    {entry.description && (
                      <p className="mt-2 text-sm text-zinc-600">{entry.description}</p>
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
