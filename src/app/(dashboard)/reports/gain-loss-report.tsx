import { Fragment } from "react";
import { formatLKR, formatUSD } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";

type CurrencyGainLoss = {
  planAmount: number | null;
  actualAmount: number | null;
  // null means there isn't enough data (no plan, or no deal value) to compare.
  status: "gain" | "loss" | "even" | null;
  // How far the actual amount is above (gain) or below (loss) the plan price.
  difference: number | null;
};

export type GainLossRow = {
  id: string;
  clientId: string;
  customer: string;
  stage: string;
  plan: string;
  lkr: CurrencyGainLoss;
  usd: CurrencyGainLoss;
  planStartDate: string | null;
};

export type RawWonDeal = {
  id: string;
  client_id: string;
  value: number | null;
  value_usd: number | null;
  closed_at: string | null;
  created_at?: string | null;
  // The plan price when the plan was set on the deal (null for deals from before
  // migration 0138, which then fall back to the plan's current price).
  plan_amount_lkr?: number | null;
  plan_amount_usd?: number | null;
  clients: { name: string } | null;
  pipeline_stages: { name: string } | null;
  plans: { name: string; amount_lkr: number | null; amount_usd: number | null } | null;
};

function computeGainLoss(planAmount: number | null, actualAmount: number | null): CurrencyGainLoss {
  let status: CurrencyGainLoss["status"] = null;
  let difference: number | null = null;

  if (planAmount != null && actualAmount != null) {
    difference = Math.abs(actualAmount - planAmount);
    // Sold above the plan price is a gain, below it is a loss, and exactly at it is
    // neither - it must not be reported as a gain.
    status = actualAmount > planAmount ? "gain" : actualAmount < planAmount ? "loss" : "even";
  }

  return { planAmount, actualAmount, status, difference };
}

function numberOrNull(value: number | string | null | undefined): number | null {
  return value != null ? Number(value) : null;
}

// Wording and date column that differ between the won-deals and open-deals reports.
export type ReportVariant = {
  title: string;
  emptyText: string;
  actualLabel: string;
  resultLabel: string;
  dateLabel: string;
};

export const WON_REPORT: ReportVariant = {
  title: "Won Deals Report",
  emptyText: "No won deals yet.",
  actualLabel: "Actual Amount",
  resultLabel: "Gain / Loss",
  dateLabel: "Plan Start Date",
};

export const OPEN_REPORT: ReportVariant = {
  title: "Open Deals Report",
  emptyText: "No open deals.",
  actualLabel: "Deal Amount",
  resultLabel: "Expected Gain / Loss",
  dateLabel: "Created",
};

/** `dateField` picks the date shown per deal: when it closed, or when it was created. */
export function buildGainLossRows(
  deals: RawWonDeal[],
  dateField: "closed_at" | "created_at" = "closed_at"
): GainLossRow[] {
  return deals.map((d) => ({
    id: d.id,
    clientId: d.client_id,
    customer: d.clients?.name ?? "-",
    stage: d.pipeline_stages?.name ?? "-",
    plan: d.plans?.name ?? "-",
    lkr: computeGainLoss(
      numberOrNull(d.plan_amount_lkr ?? d.plans?.amount_lkr),
      numberOrNull(d.value)
    ),
    usd: computeGainLoss(
      numberOrNull(d.plan_amount_usd ?? d.plans?.amount_usd),
      numberOrNull(d.value_usd)
    ),
    planStartDate: d[dateField] ?? null,
  }));
}

type GainLossGroup = {
  clientId: string;
  customer: string;
  rows: GainLossRow[];
  // Totals over the deals that have both a plan price and an amount, so the plan and
  // actual totals always compare like with like.
  lkr: CurrencyGainLoss;
  usd: CurrencyGainLoss;
};

function summarize(rows: GainLossRow[], key: "lkr" | "usd"): CurrencyGainLoss {
  const comparable = rows
    .map((r) => r[key])
    .filter((c) => c.planAmount != null && c.actualAmount != null);
  if (comparable.length === 0) return computeGainLoss(null, null);
  return computeGainLoss(
    comparable.reduce((sum, c) => sum + (c.planAmount ?? 0), 0),
    comparable.reduce((sum, c) => sum + (c.actualAmount ?? 0), 0)
  );
}

/** One group per customer, in order of each customer's most recent closed deal. */
function groupByCustomer(rows: GainLossRow[]): GainLossGroup[] {
  const groups = new Map<string, GainLossRow[]>();
  for (const row of rows) {
    const list = groups.get(row.clientId);
    if (list) list.push(row);
    else groups.set(row.clientId, [row]);
  }
  return [...groups.entries()].map(([clientId, groupRows]) => ({
    clientId,
    customer: groupRows[0].customer,
    rows: groupRows,
    lkr: summarize(groupRows, "lkr"),
    usd: summarize(groupRows, "usd"),
  }));
}

function AmountCells({ lkr, usd }: { lkr: CurrencyGainLoss; usd: CurrencyGainLoss }) {
  return (
    <>
      <td className="px-4 py-3 text-sm text-muted">
        {lkr.planAmount != null ? formatLKR(lkr.planAmount) : "-"}
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {lkr.actualAmount != null ? formatLKR(lkr.actualAmount) : "-"}
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {usd.planAmount != null ? formatUSD(usd.planAmount) : "-"}
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {usd.actualAmount != null ? formatUSD(usd.actualAmount) : "-"}
      </td>
      <td className="px-4 py-3">
        <GainLossBadge currency={lkr} format={formatLKR} />
      </td>
      <td className="px-4 py-3">
        <GainLossBadge currency={usd} format={formatUSD} />
      </td>
    </>
  );
}

function GainLossBadge({
  currency,
  format,
}: {
  currency: CurrencyGainLoss;
  format: (value: number) => string;
}) {
  if (currency.status === null) return <span className="text-sm text-subtle">-</span>;
  if (currency.status === "even") return <span className="text-sm text-muted">On plan</span>;
  const gain = currency.status === "gain";
  return (
    <span className={`text-sm font-medium ${gain ? "text-success" : "text-error"}`}>
      {gain ? "Gain" : "Loss"} · {format(currency.difference ?? 0)}
    </span>
  );
}

export function GainLossReport({
  rows,
  variant = WON_REPORT,
}: {
  rows: GainLossRow[];
  variant?: ReportVariant;
}) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{variant.title}</h2>
      </div>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-subtle">
          {variant.emptyText}
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-sunken">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Stage
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Plan
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Plan Amount (LKR)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  {variant.actualLabel} (LKR)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Plan Amount (USD)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  {variant.actualLabel} (USD)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  {variant.resultLabel} (LKR)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  {variant.resultLabel} (USD)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  {variant.dateLabel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupByCustomer(rows).map((group) =>
                group.rows.length === 1 ? (
                  <tr key={group.rows[0].id}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {group.customer}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{group.rows[0].stage}</td>
                    <td className="px-4 py-3 text-sm text-muted">{group.rows[0].plan}</td>
                    <AmountCells lkr={group.rows[0].lkr} usd={group.rows[0].usd} />
                    <td className="px-4 py-3 text-sm text-muted">
                      {group.rows[0].planStartDate ? formatDate(group.rows[0].planStartDate) : "-"}
                    </td>
                  </tr>
                ) : (
                  // A customer with several won deals: a total row, then each deal nested under it.
                  <Fragment key={group.clientId}>
                    <tr className="bg-surface-sunken/60">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">
                        {group.customer}
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <AmountCells lkr={group.lkr} usd={group.usd} />
                      <td className="px-4 py-3" />
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 pl-9 pr-4 text-sm text-subtle">↳</td>
                        <td className="px-4 py-3 text-sm text-muted">{row.stage}</td>
                        <td className="px-4 py-3 text-sm text-muted">{row.plan}</td>
                        <AmountCells lkr={row.lkr} usd={row.usd} />
                        <td className="px-4 py-3 text-sm text-muted">
                          {row.planStartDate ? formatDate(row.planStartDate) : "-"}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
