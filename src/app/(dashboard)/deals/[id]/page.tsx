import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskCheckbox } from "@/components/task-checkbox";
import { addActivity, addTask, setTaskStatus, updateDeal } from "./actions";

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-zinc-200 text-zinc-600",
};

const ACTIVITY_TYPES = ["note", "call", "email", "meeting"] as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: deal, error: dealError }, { data: activities }, { data: tasks }] =
    await Promise.all([
      supabase
        .from("deals")
        .select("*, clients(id, name), pipeline_stages(name)")
        .eq("id", id)
        .single(),
      supabase
        .from("activities")
        .select("*")
        .eq("deal_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").eq("deal_id", id).order("due_date", {
        ascending: true,
        nullsFirst: false,
      }),
    ]);

  if (dealError || !deal) notFound();

  const client = (deal as unknown as { clients: { id: string; name: string } | null }).clients;
  const stage = (deal as unknown as { pipeline_stages: { name: string } | null })
    .pipeline_stages;

  async function saveDeal(formData: FormData) {
    "use server";
    await updateDeal(id, formData);
  }

  async function addActivityAction(formData: FormData) {
    "use server";
    await addActivity(id, formData);
  }

  async function addTaskAction(formData: FormData) {
    "use server";
    await addTask(id, formData);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        {client && (
          <Link href={`/clients/${client.id}`} className="text-sm text-zinc-500 hover:text-zinc-700">
            ← {client.name}
          </Link>
        )}
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{deal.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[deal.status]}`}
              >
                {deal.status}
              </span>
              <span className="text-xs text-zinc-500">{stage?.name ?? "No stage"}</span>
              <Link href="/pipeline" className="text-xs text-zinc-400 hover:text-zinc-600">
                (change stage on Pipeline board)
              </Link>
            </div>
          </div>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
              Edit deal
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
              <form action={saveDeal} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Title *</label>
                  <input
                    name="title"
                    defaultValue={deal.title}
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Value ($)</label>
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    defaultValue={deal.value ?? ""}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Source</label>
                  <input
                    name="source"
                    defaultValue={deal.source ?? ""}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Expected close date
                  </label>
                  <input
                    name="expected_close_date"
                    type="date"
                    defaultValue={deal.expected_close_date ?? ""}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Save changes
                </button>
              </form>
            </div>
          </details>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Value</dt>
            <dd className="text-sm font-medium text-zinc-900">
              {deal.value != null ? `$${Number(deal.value).toLocaleString()}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Source</dt>
            <dd className="text-sm font-medium text-zinc-900">{deal.source ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Expected close</dt>
            <dd className="text-sm font-medium text-zinc-900">
              {deal.expected_close_date ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Closed at</dt>
            <dd className="text-sm font-medium text-zinc-900">
              {deal.closed_at ? formatDateTime(deal.closed_at) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Activity</h2>
          </div>

          <form action={addActivityAction} className="mt-3 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3">
            <div className="flex gap-2">
              <select
                name="type"
                defaultValue="note"
                className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="ml-auto rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Log activity
              </button>
            </div>
            <textarea
              name="content"
              required
              rows={2}
              placeholder="What happened?"
              className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
            />
          </form>

          <div className="mt-3 flex flex-col gap-2">
            {(!activities || activities.length === 0) && (
              <p className="text-sm text-zinc-500">No activity logged yet.</p>
            )}
            {activities?.map((activity) => (
              <div key={activity.id} className="rounded-md border border-zinc-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {activity.type}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatDateTime(activity.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-700">{activity.content}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Tasks</h2>

          <form action={addTaskAction} className="mt-3 flex gap-2 rounded-lg border border-zinc-200 bg-white p-3">
            <input
              name="title"
              required
              placeholder="New task..."
              className="flex-1 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
            />
            <input
              name="due_date"
              type="date"
              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Add
            </button>
          </form>

          <div className="mt-3 flex flex-col gap-2">
            {(!tasks || tasks.length === 0) && (
              <p className="text-sm text-zinc-500">No tasks for this deal.</p>
            )}
            {tasks?.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3"
              >
                <TaskCheckbox
                  taskId={task.id}
                  dealId={id}
                  initialDone={task.status === "DONE"}
                  onToggle={setTaskStatus}
                />
                <span
                  className={`flex-1 text-sm ${
                    task.status === "DONE" ? "text-zinc-400 line-through" : "text-zinc-800"
                  }`}
                >
                  {task.title}
                </span>
                {task.due_date && <span className="text-xs text-zinc-500">{task.due_date}</span>}
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
