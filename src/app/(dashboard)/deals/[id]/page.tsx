import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskCheckbox } from "@/components/task-checkbox";
import { formatLKR } from "@/lib/currency";
import {
  addActivity,
  addTask,
  deleteActivity,
  deleteTask,
  setTaskStatus,
  updateDeal,
} from "./actions";

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  LOST: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const ACTIVITY_TYPES = ["note", "call", "email", "meeting"] as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"
      />
    </svg>
  );
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
          <Link
            href={`/clients/${client.id}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← {client.name}
          </Link>
        )}
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {deal.title}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[deal.status]}`}
              >
                {deal.status}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {stage?.name ?? "No stage"}
              </span>
              <Link
                href="/pipeline"
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                (change stage on Pipeline board)
              </Link>
            </div>
          </div>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              Edit deal
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <form action={saveDeal} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Title *
                  </label>
                  <input
                    name="title"
                    defaultValue={deal.title}
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Value (LKR)
                  </label>
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    defaultValue={deal.value ?? ""}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Source
                  </label>
                  <input
                    name="source"
                    defaultValue={deal.source ?? ""}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Expected close date
                  </label>
                  <input
                    name="expected_close_date"
                    type="date"
                    defaultValue={deal.expected_close_date ?? ""}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Save changes
                </button>
              </form>
            </div>
          </details>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Value</dt>
            <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {deal.value != null ? formatLKR(Number(deal.value)) : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Source</dt>
            <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {deal.source ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Expected close</dt>
            <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {deal.expected_close_date ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Closed at</dt>
            <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {deal.closed_at ? formatDateTime(deal.closed_at) : "-"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Activity</h2>
          </div>

          <form
            action={addActivityAction}
            className="mt-3 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex gap-2">
              <select
                name="type"
                defaultValue="note"
                className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="ml-auto rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Log activity
              </button>
            </div>
            <textarea
              name="content"
              required
              rows={2}
              placeholder="What happened?"
              className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </form>

          <div className="mt-3 flex flex-col gap-2">
            {(!activities || activities.length === 0) && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No activity logged yet.</p>
            )}
            {activities?.map((activity) => {
              async function deleteActivityAction() {
                "use server";
                await deleteActivity(id, activity.id, activity.type);
              }
              return (
                <div
                  key={activity.id}
                  className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {activity.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {formatDateTime(activity.created_at)}
                      </span>
                      <form action={deleteActivityAction}>
                        <button
                          type="submit"
                          aria-label="Delete activity"
                          className="text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                        >
                          <TrashIcon />
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {activity.content}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Tasks</h2>

          <form
            action={addTaskAction}
            className="mt-3 flex gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <input
              name="title"
              required
              placeholder="New task..."
              className="flex-1 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              name="due_date"
              type="date"
              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Add
            </button>
          </form>

          <div className="mt-3 flex flex-col gap-2">
            {(!tasks || tasks.length === 0) && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No tasks for this deal.</p>
            )}
            {tasks?.map((task) => {
              async function deleteTaskAction() {
                "use server";
                await deleteTask(id, task.id, task.title);
              }
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <TaskCheckbox
                    taskId={task.id}
                    dealId={id}
                    initialDone={task.status === "DONE"}
                    onToggle={setTaskStatus}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      task.status === "DONE"
                        ? "text-zinc-400 line-through dark:text-zinc-500"
                        : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {task.due_date}
                    </span>
                  )}
                  <form action={deleteTaskAction}>
                    <button
                      type="submit"
                      aria-label="Delete task"
                      className="text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                    >
                      <TrashIcon />
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
