import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskCheckbox } from "@/components/task-checkbox";
import { formatLKR } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import { TrashIcon } from "@/components/icons";
import {
  addActivity,
  addTask,
  deleteActivity,
  deleteTask,
  setTaskStatus,
  updateDeal,
} from "./actions";

const statusStyles: Record<string, string> = {
  OPEN: "bg-primary/15 text-primary",
  WON: "bg-success/15 text-success",
  LOST: "bg-border text-muted",
};

const ACTIVITY_TYPES = ["note", "call", "email", "meeting"] as const;

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
            className="text-sm text-subtle hover:text-foreground"
          >
            ← {client.name}
          </Link>
        )}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold text-foreground">
              {deal.title}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[deal.status]}`}
              >
                {deal.status}
              </span>
              <span className="text-xs text-subtle">
                {stage?.name ?? "No stage"}
              </span>
              <Link
                href="/pipeline"
                className="text-xs text-subtle hover:text-foreground"
              >
                (change stage on Pipeline board)
              </Link>
            </div>
          </div>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-sunken">
              Edit deal
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-4 shadow-floating">
              <form action={saveDeal} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Title *
                  </label>
                  <input
                    name="title"
                    defaultValue={deal.title}
                    required
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Value (LKR)
                  </label>
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    defaultValue={deal.value ?? ""}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Source
                  </label>
                  <input
                    name="source"
                    defaultValue={deal.source ?? ""}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Expected close date
                  </label>
                  <input
                    name="expected_close_date"
                    type="date"
                    defaultValue={deal.expected_close_date ?? ""}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Save changes
                </button>
              </form>
            </div>
          </details>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-subtle">Value</dt>
            <dd className="text-sm font-medium text-foreground">
              {deal.value != null ? formatLKR(Number(deal.value)) : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Source</dt>
            <dd className="text-sm font-medium text-foreground">
              {deal.source ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Expected close</dt>
            <dd className="text-sm font-medium text-foreground">
              {deal.expected_close_date ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Closed at</dt>
            <dd className="text-sm font-medium text-foreground">
              {deal.closed_at ? formatDateTime(deal.closed_at) : "-"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Activity</h2>
          </div>

          <form
            action={addActivityAction}
            className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
          >
            <div className="flex gap-2">
              <select
                name="type"
                defaultValue="note"
                className="rounded-md border border-border-strong bg-surface px-2 py-1.5 text-sm text-foreground"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="ml-auto rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Log activity
              </button>
            </div>
            <textarea
              name="content"
              required
              rows={2}
              placeholder="What happened?"
              className="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
            />
          </form>

          <div className="mt-3 flex flex-col gap-2">
            {(!activities || activities.length === 0) && (
              <p className="text-sm text-subtle">No activity logged yet.</p>
            )}
            {activities?.map((activity) => {
              async function deleteActivityAction() {
                "use server";
                await deleteActivity(id, activity.id, activity.type);
              }
              return (
                <div
                  key={activity.id}
                  className="rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                      {activity.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-subtle">
                        {formatDateTime(activity.created_at)}
                      </span>
                      <form action={deleteActivityAction}>
                        <button
                          type="submit"
                          aria-label="Delete activity"
                          className="p-3.5 text-subtle hover:text-error lg:p-0"
                        >
                          <TrashIcon />
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {activity.content}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>

          <form
            action={addTaskAction}
            className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 sm:flex-row"
          >
            <input
              name="title"
              required
              placeholder="New task..."
              className="w-full flex-1 rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
            />
            <input
              name="due_date"
              type="date"
              className="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm sm:w-auto text-foreground"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto"
            >
              Add
            </button>
          </form>

          <div className="mt-3 flex flex-col gap-2">
            {(!tasks || tasks.length === 0) && (
              <p className="text-sm text-subtle">No tasks for this deal.</p>
            )}
            {tasks?.map((task) => {
              async function deleteTaskAction() {
                "use server";
                await deleteTask(id, task.id, task.title);
              }
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
                >
                  <TaskCheckbox
                    taskId={task.id}
                    dealId={id}
                    initialDone={task.status === "DONE"}
                    onToggle={setTaskStatus}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      task.status === "DONE" ? "text-subtle line-through" : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className="text-xs text-subtle">
                      {task.due_date}
                    </span>
                  )}
                  <form action={deleteTaskAction}>
                    <button
                      type="submit"
                      aria-label="Delete task"
                      className="p-3.5 text-subtle hover:text-error lg:p-0"
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
