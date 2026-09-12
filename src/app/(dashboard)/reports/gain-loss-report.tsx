import { formatLKR, formatUSD } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";

type CurrencyGainLoss = {
  planAmount: number | null;
  actualAmount: number | null;
  // null means there isn't enough data (no plan, or no deal value) to compare.
  status: "gain" | "loss" | null;
  lossAmount: number | null;
};

export type GainLossRow = {
  id: string;
  customer: string;
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
  clients: { name: string } | null;
  plans: { name: string; amount_lkr: number | null; amount_usd: number | null } | null;
};

function computeGainLoss(planAmount: number | null, actualAmount: number | null): CurrencyGainLoss {
  let status: CurrencyGainLoss["status"] = null;
  let lossAmount: number | null = null;

  if (planAmount != null && actualAmount != null) {
    const diff = planAmount - actualAmount;
    // Matches the plan price, or came in at/above it: a gain. Anything
    // below the plan price is a loss of that difference.
    status = diff <= 0 ? "gain" : "loss";
    lossAmount = diff > 0 ? diff : 0;
  }

  return { planAmount, actualAmount, status, lossAmount };
}

export function buildGainLossRows(deals: RawWonDeal[]): GainLossRow[] {
  return deals.map((d) => ({
    id: d.id,
    customer: d.clients?.name ?? "-",
    plan: d.plans?.name ?? "-",
    lkr: computeGainLoss(d.plans?.amount_lkr ?? null, d.value != null ? Number(d.value) : null),
    usd: computeGainLoss(
      d.plans?.amount_usd ?? null,
      d.value_usd != null ? Number(d.value_usd) : null
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
  if (currency.status === "gain") {
    return (
      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
        Gain
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-2 py-0.5 text-xs font-medium text-error">
      Loss · {format(currency.lossAmount ?? 0)}
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
