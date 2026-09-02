import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TaskCheckbox } from "@/components/task-checkbox";
import { setTaskStatus } from "../deals/[id]/actions";

type TaskWithDeal = {
  id: string;
  deal_id: string;
  title: string;
  due_date: string | null;
  status: string;
  deals: { title: string; clients: { name: string } | null } | null;
};

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, deal_id, title, due_date, status, deals(title, clients(name))")
    .eq("status", "PENDING")
    .order("due_date", { ascending: true, nullsFirst: false });

  const typedTasks = (tasks ?? []) as unknown as TaskWithDeal[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Open Tasks</h1>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load tasks: {error.message}
        </p>
      )}

      {!error && typedTasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Nothing open right now — nice work.
        </div>
      )}

      {!error && typedTasks.length > 0 && (
        <div className="flex flex-col gap-2">
          {typedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <TaskCheckbox
                taskId={task.id}
                dealId={task.deal_id}
                initialDone={false}
                onToggle={setTaskStatus}
              />
              <div className="flex-1">
                <p className="text-sm text-zinc-800 dark:text-zinc-200">{task.title}</p>
                <Link
                  href={`/deals/${task.deal_id}`}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  {task.deals?.title}
                  {task.deals?.clients?.name && ` · ${task.deals.clients.name}`}
                </Link>
              </div>
              {task.due_date && (
                <span
                  className={`text-xs font-medium ${
                    isOverdue(task.due_date)
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
      )}
    </div>
  );
}
