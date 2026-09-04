import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TaskCheckbox } from "@/components/task-checkbox";
import { ClientTabs } from "@/app/(dashboard)/clients/[id]/client-tabs";
import { setTaskStatus } from "../deals/[id]/actions";

type TaskWithDeal = {
  id: string;
  deal_id: string;
  title: string;
  due_date: string | null;
  status: string;
  deals: { title: string; clients: { id: string; name: string } | null } | null;
};

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function TaskGrid({ tasks, done }: { tasks: TaskWithDeal[]; done: boolean }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        {done ? "No closed tasks yet." : "No open tasks yet."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-2">
            {task.deals?.clients ? (
              <Link
                href={`/clients/${task.deals.clients.id}`}
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {task.deals.clients.name}
              </Link>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                -
              </span>
            )}
            <Link
              href={`/deals/${task.deal_id}`}
              className="shrink-0 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              {task.deals?.title}
            </Link>
          </div>

          <div className="flex items-start gap-3">
            <TaskCheckbox
              taskId={task.id}
              dealId={task.deal_id}
              initialDone={done}
              onToggle={setTaskStatus}
            />
            <p
              className={`flex-1 text-sm ${
                done
                  ? "text-zinc-400 line-through dark:text-zinc-500"
                  : "text-zinc-800 dark:text-zinc-200"
              }`}
            >
              {task.title}
            </p>
          </div>

          {task.due_date && (
            <span
              className={`text-xs font-medium ${
                !done && isOverdue(task.due_date)
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {task.due_date}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, deal_id, title, due_date, status, deals(title, clients(id, name))")
    .order("due_date", { ascending: true, nullsFirst: false });

  const typedTasks = (tasks ?? []) as unknown as TaskWithDeal[];
  const openTasks = typedTasks.filter((task) => task.status === "PENDING");
  const closedTasks = typedTasks.filter((task) => task.status === "DONE");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Tasks</h1>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load tasks: {error.message}
        </p>
      )}

      {!error && (
        <ClientTabs
          tabs={[
            {
              key: "open",
              label: "Open Tasks",
              count: openTasks.length,
              content: <TaskGrid tasks={openTasks} done={false} />,
            },
            {
              key: "closed",
              label: "Closed Tasks",
              count: closedTasks.length,
              content: <TaskGrid tasks={closedTasks} done={true} />,
            },
          ]}
        />
      )}
    </div>
  );
}
