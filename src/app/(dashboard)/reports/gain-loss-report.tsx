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
  customer: string;
  stage: string;
  plan: string;
  lkr: CurrencyGainLoss;
  usd: CurrencyGainLoss;
  planStartDate: string | null;
};

export type RawWonDeal = {
  id: string;
  value: number | null;
  value_usd: number | null;
  closed_at: string | null;
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

export function buildGainLossRows(deals: RawWonDeal[]): GainLossRow[] {
  return deals.map((d) => ({
    id: d.id,
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
    planStartDate: d.closed_at,
  }));
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

export function GainLossReport({ rows }: { rows: GainLossRow[] }) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Gain / Loss Report</h2>
      </div>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-subtle">
          No won deals yet.
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
                  Actual Amount (LKR)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Plan Amount (USD)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Actual Amount (USD)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Gain / Loss (LKR)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Gain / Loss (USD)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Plan Start Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {row.customer}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{row.stage}</td>
                  <td className="px-4 py-3 text-sm text-muted">{row.plan}</td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {row.lkr.planAmount != null ? formatLKR(row.lkr.planAmount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {row.lkr.actualAmount != null ? formatLKR(row.lkr.actualAmount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {row.usd.planAmount != null ? formatUSD(row.usd.planAmount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {row.usd.actualAmount != null ? formatUSD(row.usd.actualAmount) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <GainLossBadge currency={row.lkr} format={formatLKR} />
                  </td>
                  <td className="px-4 py-3">
                    <GainLossBadge currency={row.usd} format={formatUSD} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {row.planStartDate ? formatDate(row.planStartDate) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
