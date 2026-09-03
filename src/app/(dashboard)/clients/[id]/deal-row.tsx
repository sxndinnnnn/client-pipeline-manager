"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatLKR } from "@/lib/currency";
import { TaskCheckbox } from "@/components/task-checkbox";
import type { Activity, Deal, Task } from "@/types/database";

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  LOST: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const ACTIVITY_TYPES = ["note", "call", "email", "meeting"] as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
      />
    </svg>
  );
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

type DealWithStage = Deal & { pipeline_stages: { name: string } | null };

export function DealRow({
  deal,
  activities,
  tasks,
  onUpdate,
  onDelete,
  onAddActivity,
  onAddTask,
  onSetTaskStatus,
}: {
  deal: DealWithStage;
  activities: Activity[];
  tasks: Task[];
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: () => Promise<void>;
  onAddActivity: (formData: FormData) => Promise<void>;
  onAddTask: (formData: FormData) => Promise<void>;
  onSetTaskStatus: (dealId: string, taskId: string, done: boolean) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // Portal target (document.body) only exists client-side; same
    // mount-detection pattern used by ThemeToggle and ContactRow.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function openView() {
    setEditing(false);
    dialogRef.current?.showModal();
  }

  function openEdit() {
    setEditing(true);
    dialogRef.current?.showModal();
  }

  const stageName = deal.pipeline_stages?.name ?? "No stage";

  return (
    <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {deal.title}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{stageName}</td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {deal.value != null ? formatLKR(Number(deal.value)) : "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[deal.status]}`}
        >
          {deal.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={openView}
            aria-label="View deal"
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <EyeIcon />
          </button>
          <button
            type="button"
            onClick={openEdit}
            aria-label="Edit deal"
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete()}
            aria-label="Delete deal"
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <TrashIcon />
          </button>
        </div>
      </td>

      {mounted &&
        createPortal(
          <dialog
            ref={dialogRef}
            onClick={(e) => {
              const rect = dialogRef.current?.getBoundingClientRect();
              if (!rect) return;
              const outside =
                e.clientY < rect.top ||
                e.clientY > rect.bottom ||
                e.clientX < rect.left ||
                e.clientX > rect.right;
              if (outside) dialogRef.current?.close();
            }}
            className="m-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-5 shadow-lg backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {deal.title}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[deal.status]}`}
                  >
                    {deal.status}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{stageName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing((v) => !v)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {editing ? "Cancel" : "Edit deal"}
                </button>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  aria-label="Close"
                  className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                >
                  <XIcon />
                </button>
              </div>
            </div>

            {editing ? (
              <form
                action={async (formData) => {
                  await onUpdate(formData);
                  setEditing(false);
                }}
                className="mt-4 flex flex-col gap-3"
              >
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
                    Expected Close Date
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
                  className="mt-1 self-start rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Value</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {deal.value != null ? formatLKR(Number(deal.value)) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Source</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {deal.source ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Expected close</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {deal.expected_close_date ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Closed at</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {deal.closed_at ? formatDateTime(deal.closed_at) : "—"}
                  </dd>
                </div>
              </dl>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Activity
                </h3>
                <form
                  action={onAddActivity}
                  className="mt-2 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
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

                <div className="mt-3 flex max-h-60 flex-col gap-2 overflow-y-auto">
                  {activities.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No activity logged yet.
                    </p>
                  )}
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          {activity.type}
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {formatDateTime(activity.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {activity.content}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Tasks</h3>
                <form
                  action={onAddTask}
                  className="mt-2 flex gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
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

                <div className="mt-3 flex max-h-60 flex-col gap-2 overflow-y-auto">
                  {tasks.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No tasks for this deal.
                    </p>
                  )}
                  {tasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <TaskCheckbox
                        taskId={task.id}
                        dealId={deal.id}
                        initialDone={task.status === "DONE"}
                        onToggle={onSetTaskStatus}
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
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </dialog>,
          document.body
        )}
    </tr>
  );
}
