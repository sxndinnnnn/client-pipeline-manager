"use client";

import { useRef, useState } from "react";
import { XIcon } from "@/components/icons";
import { isPlanActive } from "@/lib/plans";
import type { Plan } from "@/types/database";

export function AddDealModal({
  createDealAction,
  plans,
}: {
  createDealAction: (formData: FormData) => Promise<void>;
  plans: Plan[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState("");

  function open() {
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const plan = plans.find((p) => p.id === e.target.value);
    if (plan?.amount_lkr != null) {
      setValue(String(plan.amount_lkr));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Add Deal
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
      >
        <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Add Deal</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="p-3.5 text-subtle hover:text-foreground lg:p-0"
            >
              <XIcon />
            </button>
          </div>

          <form
            action={async (formData) => {
              await createDealAction(formData);
              close();
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-muted">
                Deal Title *
              </label>
              <input
                name="title"
                required
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Plan
              </label>
              <select
                name="plan_id"
                defaultValue=""
                onChange={handlePlanChange}
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              >
                <option value="">Select a plan</option>
                {plans.filter((plan) => isPlanActive(plan)).map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
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
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
              <p className="mt-1 text-xs text-subtle">Autofills from the plan - editable.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Source
              </label>
              <input
                name="source"
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Expected Close Date
              </label>
              <input
                name="expected_close_date"
                type="date"
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <button
              type="submit"
              className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Create Deal
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
