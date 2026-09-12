"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatLKR } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";
import { EyeIcon, TrashIcon, XIcon } from "@/components/icons";
import { isPlanActive } from "@/lib/plans";
import type { Activity, Deal, Plan } from "@/types/database";

const statusStyles: Record<string, string> = {
  OPEN: "bg-primary/15 text-primary",
  WON: "bg-success/15 text-success",
  LOST: "bg-border text-muted",
};

const ACTIVITY_TYPES = ["note", "call", "email", "meeting"] as const;

type DealWithStage = Deal & {
  pipeline_stages: { name: string } | null;
  plans: { name: string } | null;
};

export function DealRow({
  deal,
  activities,
  plans,
  onUpdate,
  onDelete,
  onAddActivity,
  onDeleteActivity,
}: {
  deal: DealWithStage;
  activities: Activity[];
  plans: Plan[];
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: () => Promise<void>;
  onAddActivity: (formData: FormData) => Promise<void>;
  onDeleteActivity: (dealId: string, activityId: string, type: Activity["type"]) => Promise<void>;
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

  useEffect(() => {
    // Defensive: this row is keyed by deal.id, so if the same deal was
    // viewed earlier and the browser/router reuses this component instance
    // across a navigation (back/forward cache, router cache) instead of a
    // fresh mount, force the dialog closed rather than trust inherited
    // `open` state - it should only ever open from an explicit click.
    if (mounted) {
      dialogRef.current?.close();
    }
  }, [mounted]);

  function openView() {
    setEditing(false);
    dialogRef.current?.showModal();
  }

  const stageName = deal.pipeline_stages?.name ?? "No stage";

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {deal.title}
      </td>
      <td className="px-4 py-3 text-sm text-muted">{stageName}</td>
      <td className="px-4 py-3 text-sm text-muted">
        {deal.value != null ? formatLKR(Number(deal.value)) : "-"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[deal.status]}`}
        >
          {deal.status}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={openView}
          aria-label="View deal"
          className="p-3.5 text-subtle hover:text-foreground lg:p-0"
        >
          <EyeIcon />
        </button>
      </td>

      {mounted &&
        createPortal(
          <dialog
            ref={dialogRef}
            onClick={(e) => {
              if (e.target === dialogRef.current) dialogRef.current?.close();
            }}
            className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
          >
          <div className="flex max-h-[92vh] w-[95vw] max-w-5xl flex-col overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-foreground">
                  {deal.title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing((v) => !v)}
                  className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-sunken"
                >
                  {editing ? "Cancel" : "Edit Deal"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete();
                    dialogRef.current?.close();
                  }}
                  className="rounded-md border border-error/40 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10"
                >
                  Delete Deal
                </button>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  aria-label="Close"
                  className="p-3.5 text-subtle hover:text-foreground lg:p-0"
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
                className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Plan *
                  </label>
                  <select
                    name="plan_id"
                    required
                    defaultValue={deal.plan_id ?? ""}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  >
                    <option value="" disabled>Select a plan</option>
                    {plans
                      .filter((plan) => isPlanActive(plan) || plan.id === deal.plan_id)
                      .map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                          {!isPlanActive(plan) ? " (Expired)" : ""}
                        </option>
                      ))}
                  </select>
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
                <button
                  type="submit"
                  className="col-span-full mt-1 self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-subtle">Plan</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {deal.plans?.name ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">Value</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {deal.value != null ? formatLKR(Number(deal.value)) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">Closed At</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {deal.closed_at ? formatDateTime(deal.closed_at) : "-"}
                  </dd>
                </div>
              </dl>
            )}

            <div className="mt-6 flex min-h-0 flex-1 flex-col">
              <h3 className="border-b border-border pb-2 text-sm font-medium text-foreground">
                Activity
              </h3>

              <div className="pt-4">
                <form
                  action={onAddActivity}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-surface-sunken p-3"
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
                      Log Activity
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

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {activities.length === 0 && (
                    <p className="text-sm text-subtle">
                      No activity logged yet.
                    </p>
                  )}
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                          {activity.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-subtle">
                            {formatDateTime(activity.created_at)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteActivity(deal.id, activity.id, activity.type)}
                            aria-label="Delete activity"
                            className="p-3.5 text-subtle hover:text-error lg:p-0"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {activity.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </dialog>,
          document.body
        )}
    </tr>
  );
}
