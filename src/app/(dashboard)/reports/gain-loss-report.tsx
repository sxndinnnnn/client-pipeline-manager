import { formatLKR } from "@/lib/currency";
import { formatDate } from "@/lib/datetime";

export type GainLossRow = {
  id: string;
  customer: string;
  deal: string;
  plan: string;
  planAmount: number | null;
  actualAmount: number | null;
  // null means there isn't enough data (no plan, or no deal value) to compare.
  status: "gain" | "loss" | null;
  lossAmount: number | null;
  planStartDate: string | null;
};

export type RawWonDeal = {
  id: string;
  title: string;
  value: number | null;
  closed_at: string | null;
  clients: { name: string } | null;
  plans: { name: string; amount_lkr: number | null } | null;
};

export function buildGainLossRows(deals: RawWonDeal[]): GainLossRow[] {
  return deals.map((d) => {
    const planAmount = d.plans?.amount_lkr ?? null;
    const actualAmount = d.value != null ? Number(d.value) : null;

    let status: GainLossRow["status"] = null;
    let lossAmount: number | null = null;

    if (planAmount != null && actualAmount != null) {
      const diff = planAmount - actualAmount;
      // Matches the plan price, or came in at/above it: a gain. Anything
      // below the plan price is a loss of that difference.
      status = diff <= 0 ? "gain" : "loss";
      lossAmount = diff > 0 ? diff : 0;
    }

    return {
      id: d.id,
      customer: d.clients?.name ?? "-",
      deal: d.title,
      plan: d.plans?.name ?? "-",
      planAmount,
      actualAmount,
      status,
      lossAmount,
      planStartDate: d.closed_at,
    };
  });
}

export function GainLossReport({ rows }: { rows: GainLossRow[] }) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Gain / Loss Report</h2>
        <p className="text-sm text-subtle">
          Won deals compared against their plan&apos;s price - a deal that closed
          below plan price shows the shortfall as a loss.
        </p>
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
                  Deal
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Plan
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Plan Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Actual Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Gain / Loss
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
                  <td className="px-4 py-3 text-sm text-muted">{row.deal}</td>
                  <td className="px-4 py-3 text-sm text-muted">{row.plan}</td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {row.planAmount != null ? formatLKR(row.planAmount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {row.actualAmount != null ? formatLKR(row.actualAmount) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === null && <span className="text-sm text-subtle">-</span>}
                    {row.status === "gain" && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                        Gain
                      </span>
                    )}
                    {row.status === "loss" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-2 py-0.5 text-xs font-medium text-error">
                        Loss · {formatLKR(row.lossAmount ?? 0)}
                      </span>
                    )}
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
