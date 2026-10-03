"use client";

import { useRef, useState } from "react";
import type { Plan, PlanPlatform, PlanPlatformLine } from "@/types/database";
import { formatLKR } from "@/lib/currency";
import { isPlanActive } from "@/lib/plans";
import { PencilIcon, TrashIcon, XIcon } from "@/components/icons";
import { createPlan, deletePlan, updatePlan } from "./plans-actions";
import { SubmitButton } from "@/components/submit-button";

const PLATFORMS: PlanPlatform[] = ["GPS", "TMS", "DVR", "HSC", "FMS"];

function formatUSD(value: number | null) {
  return value != null ? `$${value.toLocaleString()}` : "-";
}

function formatCount(value: number | null) {
  return value != null ? value.toLocaleString() : "-";
}

function formatValidity(plan: Plan) {
  if (!plan.valid_from && !plan.valid_to) return "-";
  return `${plan.valid_from ?? "?"} → ${plan.valid_to ?? "?"}`;
}

const INPUT =
  "w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-foreground disabled:opacity-40";
const FIELD =
  "mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground";
const READONLY =
  "mt-1 w-full cursor-default rounded-md border border-border bg-surface-sunken px-2.5 py-1.5 text-sm text-foreground";

type PlatformRow = {
  on: boolean;
  basis: "UNITS" | "SHIPMENTS";
  qty: string;
  lkr: string;
  usd: string;
};

function initialRows(plan?: Plan, lines: PlanPlatformLine[] = []): Record<PlanPlatform, PlatformRow> {
  const rows = {} as Record<PlanPlatform, PlatformRow>;
  for (const platform of PLATFORMS) {
    const line = lines.find((l) => l.platform === platform);
    rows[platform] = {
      // Older plans only know which platforms they cover, not how they were priced.
      on: line != null || (plan?.platforms.includes(platform) ?? false),
      basis: line?.billing_basis ?? "UNITS",
      qty: line ? String(line.quantity) : "",
      lkr: line ? String(line.price_lkr) : "",
      usd: line ? String(line.price_usd) : "",
    };
  }
  return rows;
}

const money = (n: number, prefix: string) =>
  `${prefix}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function PlanFormFields({ plan, lines }: { plan?: Plan; lines?: PlanPlatformLine[] }) {
  const [rows, setRows] = useState(() => initialRows(plan, lines));

  function update(platform: PlanPlatform, patch: Partial<PlatformRow>) {
    setRows((prev) => ({ ...prev, [platform]: { ...prev[platform], ...patch } }));
  }

  const priced = PLATFORMS.filter((p) => rows[p].on && rows[p].qty && rows[p].lkr && rows[p].usd);
  const lineLkr = (p: PlanPlatform) => Number(rows[p].qty) * Number(rows[p].lkr);
  const lineUsd = (p: PlanPlatform) => Number(rows[p].qty) * Number(rows[p].usd);

  // Totals come from the priced rows. An older plan with no per-platform pricing yet keeps
  // showing its stored totals until prices are entered.
  const useStored = priced.length === 0 && plan != null;
  const totalLkr = priced.reduce((s, p) => s + lineLkr(p), 0);
  const totalUsd = priced.reduce((s, p) => s + lineUsd(p), 0);
  const units = priced
    .filter((p) => rows[p].basis === "UNITS")
    .reduce((s, p) => s + Number(rows[p].qty), 0);
  const shipments = priced
    .filter((p) => rows[p].basis === "SHIPMENTS")
    .reduce((s, p) => s + Number(rows[p].qty), 0);

  const shown = {
    usd: useStored ? (plan?.amount_usd ?? null) : totalUsd,
    lkr: useStored ? (plan?.amount_lkr ?? null) : totalLkr,
    units: useStored ? (plan?.vehicle_count ?? null) : units,
    shipments: useStored ? (plan?.shipment_count ?? null) : shipments,
  };
  const th = "px-1 py-1 text-left text-[11px] font-medium text-muted";

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-muted">Plan Name *</label>
        <input name="name" defaultValue={plan?.name} required className={FIELD} />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted">Platforms</label>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[34rem] table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-7" />
              <col className="w-14" />
              <col className="w-28" />
              <col className="w-16" />
              <col />
              <col />
              <col className="w-32" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th className={th} />
                <th className={th}>Platform</th>
                <th className={th}>Billed By</th>
                <th className={th}>Qty</th>
                <th className={th}>Price (LKR)</th>
                <th className={th}>Price (USD)</th>
                <th className={th}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map((platform) => {
                const row = rows[platform];
                const complete = row.on && row.qty && row.lkr && row.usd;
                return (
                  <tr
                    key={platform}
                    className={`border-b border-border ${row.on ? "" : "opacity-50"}`}
                  >
                    <td className="px-1 py-1.5">
                      <input
                        type="checkbox"
                        name="platforms"
                        value={platform}
                        checked={row.on}
                        onChange={(e) => update(platform, { on: e.target.checked })}
                        aria-label={`Include ${platform}`}
                        className="h-4 w-4 rounded border-border-strong accent-primary"
                      />
                    </td>
                    <td className="px-1 py-1.5 text-sm text-foreground">{platform}</td>
                    <td className="px-1 py-1.5">
                      <select
                        name={`basis_${platform}`}
                        value={row.basis}
                        disabled={!row.on}
                        onChange={(e) =>
                          update(platform, { basis: e.target.value as PlatformRow["basis"] })
                        }
                        className={INPUT}
                      >
                        <option value="UNITS">Units</option>
                        <option value="SHIPMENTS">Shipments</option>
                      </select>
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        name={`qty_${platform}`}
                        type="number"
                        min="0"
                        step="any"
                        value={row.qty}
                        disabled={!row.on}
                        onChange={(e) => update(platform, { qty: e.target.value })}
                        className={INPUT}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        name={`price_lkr_${platform}`}
                        type="number"
                        min="0"
                        step="any"
                        value={row.lkr}
                        disabled={!row.on}
                        onChange={(e) => update(platform, { lkr: e.target.value })}
                        className={INPUT}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        name={`price_usd_${platform}`}
                        type="number"
                        min="0"
                        step="any"
                        value={row.usd}
                        disabled={!row.on}
                        onChange={(e) => update(platform, { usd: e.target.value })}
                        className={INPUT}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-[11px] text-muted">
                      {complete
                        ? `${money(lineLkr(platform), "LKR ")} | ${money(lineUsd(platform), "$")}`
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-muted">Amount (USD)</label>
          <input
            readOnly
            tabIndex={-1}
            value={shown.usd != null ? money(shown.usd, "$") : "-"}
            className={READONLY}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Amount (LKR)</label>
          <input
            readOnly
            tabIndex={-1}
            value={shown.lkr != null ? money(shown.lkr, "LKR ") : "-"}
            className={READONLY}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Unit Count</label>
          <input
            readOnly
            tabIndex={-1}
            value={shown.units != null ? shown.units.toLocaleString() : "-"}
            className={READONLY}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Shipment Count</label>
          <input
            readOnly
            tabIndex={-1}
            value={shown.shipments != null ? shown.shipments.toLocaleString() : "-"}
            className={READONLY}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted">Valid From</label>
          <input name="valid_from" type="date" defaultValue={plan?.valid_from ?? ""} className={FIELD} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Valid To</label>
          <input name="valid_to" type="date" defaultValue={plan?.valid_to ?? ""} className={FIELD} />
        </div>
      </div>
    </>
  );
}

function AddPlanModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped after a save so the pricing rows start empty next time the dialog opens.
  const [formKey, setFormKey] = useState(0);

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
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
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
              setError(null);
              const result = await createPlan(formData);
              if (result.error) setError(result.error);
              else {
                dialogRef.current?.close();
                setFormKey((k) => k + 1);
              }
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <PlanFormFields key={formKey} />
            {error && <p className="text-xs text-error">{error}</p>}
            <SubmitButton className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">Create Plan</SubmitButton>
          </form>
        </div>
      </dialog>
    </>
  );
}

function PlanRow({ plan, lines }: { plan: Plan; lines: PlanPlatformLine[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-foreground">{plan.name}</td>
      <td className="px-4 py-3 text-sm text-muted">
        {plan.platforms.length > 0 ? plan.platforms.join(" | ") : "-"}
      </td>
      <td className="px-4 py-3 text-sm text-muted">{formatUSD(plan.amount_usd)}</td>
      <td className="px-4 py-3 text-sm text-muted">{formatLKR(plan.amount_lkr ?? 0)}</td>
      <td className="px-4 py-3 text-sm text-muted">{formatCount(plan.vehicle_count)}</td>
      <td className="px-4 py-3 text-sm text-muted">{formatCount(plan.shipment_count)}</td>
      <td className="px-4 py-3 text-sm text-muted">{formatValidity(plan)}</td>
      <td className="px-4 py-3 text-sm text-muted">
        {isPlanActive(plan) ? "Active" : "Expired"}
      </td>
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
              const result = await deletePlan(plan.id, plan.name);
            if (result.error) alert(result.error);
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
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
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
              setError(null);
              const result = await updatePlan(plan.id, formData);
              if (result.error) setError(result.error);
              else dialogRef.current?.close();
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <PlanFormFields plan={plan} lines={lines} />
            {error && <p className="text-xs text-error">{error}</p>}
            <SubmitButton className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">Save Changes</SubmitButton>
          </form>
        </div>
      </dialog>
    </tr>
  );
}

export function PlansPanel({
  plans,
  linesByPlan,
}: {
  plans: Plan[];
  linesByPlan: Record<string, PlanPlatformLine[]>;
}) {
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
                Plan Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Platforms
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Amount (USD)
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Amount (LKR)
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Units
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Shipments
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Validity
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-subtle">
                  No plans yet.
                </td>
              </tr>
            )}
            {plans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} lines={linesByPlan[plan.id] ?? []} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
