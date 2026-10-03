"use client";

import { useRef, useState } from "react";
import { XIcon } from "@/components/icons";
import { isPlanActive } from "@/lib/plans";
import type { Plan, PlanPlatformLine } from "@/types/database";
import { DealPlanFields } from "./deal-plan-fields";
import { SubmitButton } from "@/components/submit-button";

export function AddDealModal({
  createDealAction,
  plans,
  planLines,
}: {
  createDealAction: (formData: FormData) => Promise<void>;
  plans: Plan[];
  planLines: Record<string, PlanPlatformLine[]>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Bumped on submit so the next time the dialog opens it starts empty.
  const [formKey, setFormKey] = useState(0);

  function open() {
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
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
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
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
              close();
              setFormKey((k) => k + 1);
              await createDealAction(formData);
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <DealPlanFields
              key={formKey}
              plans={plans.filter((plan) => isPlanActive(plan))}
              planLines={planLines}
            />
            <SubmitButton className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">Create Deal</SubmitButton>
          </form>
        </div>
      </dialog>
    </>
  );
}
