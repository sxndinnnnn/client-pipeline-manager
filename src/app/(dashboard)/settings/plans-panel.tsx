"use client";

import { useRef, useState } from "react";
import type { Plan, PlanPlatform } from "@/types/database";
import { formatLKR } from "@/lib/currency";
import { PencilIcon, TrashIcon, XIcon } from "@/components/icons";
import { createPlan, deletePlan, updatePlan } from "./plans-actions";

const PLATFORMS: PlanPlatform[] = ["GPS", "TMS", "DVR", "HES", "FMS"];

function formatUSD(value: number | null) {
  return value != null ? `$${value.toLocaleString()}` : "-";
}

function formatValidity(plan: Plan) {
  if (!plan.valid_from && !plan.valid_to) return "-";
  return `${plan.valid_from ?? "?"} → ${plan.valid_to ?? "?"}`;
}

function PlatformFields({ selected }: { selected?: PlanPlatform[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted">Platforms</label>
      <div className="mt-1.5 flex flex-wrap gap-3">
        {PLATFORMS.map((platform) => (
          <label key={platform} className="flex items-center gap-1.5 text-sm text-foreground">
            <input
              type="checkbox"
              name="platforms"
              value={platform}
              defaultChecked={selected?.includes(platform)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            {platform}
          </label>
        ))}
      </div>
    </div>
  );
}

function PlanFormFields({ plan }: { plan?: Plan }) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-muted">Plan Name *</label>
        <input
          name="name"
          defaultValue={plan?.name}
          required
          className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
        />
      </div>
      <PlatformFields selected={plan?.platforms} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted">Amount (USD)</label>
          <input
            name="amount_usd"
            type="number"
            step="0.01"
            defaultValue={plan?.amount_usd ?? ""}
            className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Amount (LKR)</label>
          <input
            name="amount_lkr"
            type="number"
            step="0.01"
            defaultValue={plan?.amount_lkr ?? ""}
            className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted">Valid From</label>
          <input
            name="valid_from"
            type="date"
            defaultValue={plan?.valid_from ?? ""}
            className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Valid To</label>
          <input
            name="valid_to"
            type="date"
            defaultValue={plan?.valid_to ?? ""}
            className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
          />
        </div>
      </div>
    </>
  );
}

function AddPlanModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Add Plan
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
      >
        <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Add Plan</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="p-3.5 text-subtle hover:text-foreground lg:p-0"
            >
              <XIcon />
            </button>
          </div>
          <form
            action={async (formData) => {
              try {
                setError(null);
                await createPlan(formData);
                dialogRef.current?.close();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to create plan");
              }
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <PlanFormFields />
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              type="submit"
              className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Create Plan
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}

function PlanRow({ plan }: { plan: Plan }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-foreground">{plan.name}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {plan.platforms.length === 0 && <span className="text-sm text-subtle">-</span>}
          {plan.platforms.map((p) => (
            <span key={p} className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-muted">
              {p}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted">{formatUSD(plan.amount_usd)}</td>
      <td className="px-4 py-3 text-sm text-muted">{formatLKR(plan.amount_lkr ?? 0)}</td>
      <td className="px-4 py-3 text-sm text-muted">{formatValidity(plan)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            aria-label="Edit plan"
            className="p-3.5 text-subtle hover:text-foreground lg:p-0"
          >
            <PencilIcon />
          </button>
          <form
            action={async () => {
              try {
                await deletePlan(plan.id, plan.name);
              } catch (err) {
                alert(err instanceof Error ? err.message : "Failed to delete plan");
              }
            }}
          >
            <button
              type="submit"
              aria-label="Delete plan"
              className="p-3.5 text-error hover:opacity-80 lg:p-0"
            >
              <TrashIcon />
            </button>
          </form>
        </div>
      </td>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
      >
        <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Edit Plan</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="p-3.5 text-subtle hover:text-foreground lg:p-0"
            >
              <XIcon />
            </button>
          </div>
          <form
            action={async (formData) => {
              try {
                setError(null);
                await updatePlan(plan.id, formData);
                dialogRef.current?.close();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to update plan");
              }
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <PlanFormFields plan={plan} />
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              type="submit"
              className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save Changes
            </button>
          </form>
        </div>
      </dialog>
    </tr>
  );
}

export function PlansPanel({ plans }: { plans: Plan[] }) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Plans</h2>
        </div>
        <AddPlanModal />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Platforms
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                USD
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                LKR
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Validity
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-subtle">
                  No plans yet.
                </td>
              </tr>
            )}
            {plans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
