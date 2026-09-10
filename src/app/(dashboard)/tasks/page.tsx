import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TaskCheckbox } from "@/components/task-checkbox";
import { ClientTabs } from "@/app/(dashboard)/clients/[id]/client-tabs";
import { deleteTask, setTaskStatus } from "../deals/[id]/actions";
import { TrashIcon } from "@/components/icons";

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
      <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-subtle">
        {done ? "No closed tasks yet." : "No open tasks yet."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => {
        async function deleteTaskAction() {
          "use server";
          await deleteTask(task.deal_id, task.id, task.title);
        }
        return (
          <div
            key={task.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-resting transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-raised"
          >
            <div className="flex items-start justify-between gap-2">
              {task.deals?.clients ? (
                <Link
                  href={`/clients/${task.deals.clients.id}`}
                  className="text-xs font-semibold uppercase tracking-wide text-subtle hover:text-foreground"
                >
                  {task.deals.clients.name}
                </Link>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  -
                </span>
              )}
              <Link
                href={`/deals/${task.deal_id}`}
                className="shrink-0 text-xs text-subtle hover:text-foreground"
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
                  done ? "text-subtle line-through" : "text-foreground"
                }`}
              >
                {task.title}
              </p>
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

            {task.due_date && (
              <span
                className={`text-xs font-medium ${
                  !done && isOverdue(task.due_date) ? "text-error" : "text-subtle"
                }`}
              >
                {task.due_date}
              </span>
            )}
          </div>
        );
      })}
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
      {error && (
        <p className="text-sm text-error">
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
