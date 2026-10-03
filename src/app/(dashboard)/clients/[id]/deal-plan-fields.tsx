"use client";

import { useState } from "react";
import type { DealPlatformLine, Plan, PlanPlatformLine } from "@/types/database";

type Row = {
  platform: string;
  basis: "UNITS" | "SHIPMENTS";
  qty: string;
  lkr: string;
  usd: string;
};

const INPUT =
  "w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-foreground";
const FIELD =
  "mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground";
const READONLY =
  "mt-1 w-full cursor-default rounded-md border border-border bg-surface-sunken px-2.5 py-1.5 text-sm text-foreground";
const TH = "px-1 py-1 text-left text-[11px] font-medium text-muted";

const money = (n: number, prefix: string) =>
  `${prefix}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function rowsFrom(lines: (PlanPlatformLine | DealPlatformLine)[]): Row[] {
  return lines.map((l) => ({
    platform: l.platform,
    basis: l.billing_basis,
    qty: String(l.quantity),
    lkr: String(l.price_lkr),
    usd: String(l.price_usd),
  }));
}

/**
 * Plan picker plus the plan's per-platform lines, pre-filled and editable for one deal.
 * With lines, Value (LKR/USD) are read-only totals (the server recomputes them on save);
 * a plan without a per-platform breakdown falls back to plain editable Value boxes.
 */
export function DealPlanFields({
  plans,
  planLines,
  initialPlanId = "",
  initialLines,
  initialValue,
  initialValueUsd,
  autoFillFromPlan = true,
}: {
  plans: Plan[];
  planLines: Record<string, PlanPlatformLine[]>;
  initialPlanId?: string;
  /** The deal's own saved lines (when editing); falls back to the plan's lines. */
  initialLines?: DealPlatformLine[];
  initialValue?: string;
  initialValueUsd?: string;
  /** Add Deal pre-fills the Value boxes from the plan; Edit keeps the deal's own values. */
  autoFillFromPlan?: boolean;
}) {
  const [planId, setPlanId] = useState(initialPlanId);
  // An existing deal without saved lines keeps its plain values until the plan is changed;
  // it is not silently converted to the plan's lines.
  const [rows, setRows] = useState<Row[]>(() =>
    initialLines && initialLines.length > 0
      ? rowsFrom(initialLines)
      : autoFillFromPlan
        ? rowsFrom(planLines[initialPlanId] ?? [])
        : []
  );
  const [value, setValue] = useState(initialValue ?? "");
  const [valueUsd, setValueUsd] = useState(initialValueUsd ?? "");

  const plan = plans.find((p) => p.id === planId);
  const planList = planLines[planId] ?? [];

  function loadPlan(id: string) {
    setPlanId(id);
    setRows(rowsFrom(planLines[id] ?? []));
    if (autoFillFromPlan) {
      const p = plans.find((x) => x.id === id);
      setValue(p?.amount_lkr != null ? String(p.amount_lkr) : "");
      setValueUsd(p?.amount_usd != null ? String(p.amount_usd) : "");
    }
  }

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const lineLkr = (r: Row) => Number(r.qty) * Number(r.lkr);
  const lineUsd = (r: Row) => Number(r.qty) * Number(r.usd);
  const complete = (r: Row) => r.qty !== "" && r.lkr !== "" && r.usd !== "";

  const totalLkr = rows.reduce((s, r) => s + (complete(r) ? lineLkr(r) : 0), 0);
  const totalUsd = rows.reduce((s, r) => s + (complete(r) ? lineUsd(r) : 0), 0);
  const units = rows
    .filter((r) => r.basis === "UNITS")
    .reduce((s, r) => s + (Number(r.qty) || 0), 0);
  const shipments = rows
    .filter((r) => r.basis === "SHIPMENTS")
    .reduce((s, r) => s + (Number(r.qty) || 0), 0);

  const listLkr = planList.reduce((s, l) => s + l.quantity * l.price_lkr, 0);
  const listUsd = planList.reduce((s, l) => s + l.quantity * l.price_usd, 0);
  const diff = totalLkr - listLkr;

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-muted">Plan *</label>
        <select
          name="plan_id"
          required
          value={planId}
          onChange={(e) => loadPlan(e.target.value)}
          className={FIELD}
        >
          <option value="" disabled>
            Select a plan
          </option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted">Value (LKR)</label>
            <input
              name="value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted">Value (USD)</label>
            <input
              name="value_usd"
              type="number"
              step="0.01"
              value={valueUsd}
              onChange={(e) => setValueUsd(e.target.value)}
              className={FIELD}
            />
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-muted">Plan Details For This Deal</label>
            <div className="mt-1 overflow-x-auto">
              <table className="w-full min-w-[32rem] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-14" />
                  <col className="w-28" />
                  <col className="w-16" />
                  <col />
                  <col />
                  <col className="w-32" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border">
                    <th className={TH}>Platform</th>
                    <th className={TH}>Billed By</th>
                    <th className={TH}>Qty</th>
                    <th className={TH}>Price (LKR)</th>
                    <th className={TH}>Price (USD)</th>
                    <th className={TH}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.platform} className="border-b border-border">
                      <td className="px-1 py-1.5 text-sm text-foreground">
                        {r.platform}
                        <input type="hidden" name="platforms" value={r.platform} />
                      </td>
                      <td className="px-1 py-1.5">
                        <select
                          name={`basis_${r.platform}`}
                          value={r.basis}
                          onChange={(e) => update(i, { basis: e.target.value as Row["basis"] })}
                          className={INPUT}
                        >
                          <option value="UNITS">Units</option>
                          <option value="SHIPMENTS">Shipments</option>
                        </select>
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          name={`qty_${r.platform}`}
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={r.qty}
                          onChange={(e) => update(i, { qty: e.target.value })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          name={`price_lkr_${r.platform}`}
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={r.lkr}
                          onChange={(e) => update(i, { lkr: e.target.value })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          name={`price_usd_${r.platform}`}
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={r.usd}
                          onChange={(e) => update(i, { usd: e.target.value })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-1 py-1.5 text-[11px] text-muted">
                        {complete(r)
                          ? `${money(lineLkr(r), "LKR ")} | ${money(lineUsd(r), "$")}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted">Value (USD)</label>
              <input readOnly tabIndex={-1} value={money(totalUsd, "$")} className={READONLY} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Value (LKR)</label>
              <input readOnly tabIndex={-1} value={money(totalLkr, "LKR ")} className={READONLY} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Unit Count</label>
              <input readOnly tabIndex={-1} value={units.toLocaleString()} className={READONLY} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Shipment Count</label>
              <input readOnly tabIndex={-1} value={shipments.toLocaleString()} className={READONLY} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted">
              Plan price: {money(listLkr, "LKR ")} | {money(listUsd, "$")}
            </span>
            <span
              className={
                Math.abs(diff) < 0.005 ? "text-muted" : diff > 0 ? "text-success" : "text-error"
              }
            >
              {Math.abs(diff) < 0.005
                ? "On plan"
                : `${diff > 0 ? "Above" : "Below"} plan by ${money(Math.abs(diff), "LKR ")}`}
            </span>
            <button
              type="button"
              onClick={() => loadPlan(planId)}
              className="text-primary hover:underline"
            >
              Reset To Plan
            </button>
          </div>
        </>
      )}
      {plan && rows.length === 0 && (
        <p className="text-xs text-subtle">
          This plan has no per-platform breakdown, so enter the deal value directly.
        </p>
      )}
    </>
  );
}
