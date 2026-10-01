import type { Deal, PipelineStage, SalesTarget } from "@/types/database";
import {
  colomboYear,
  monthKey,
  monthsOfYear,
} from "./period";

export type ClientLite = {
  id: string;
  name: string;
  is_active: boolean;
};

export type MetricsInput = {
  now: Date;
  deals: Deal[];
  stages: PipelineStage[];
  clients: ClientLite[];
  targets: SalesTarget[];
};

type Money = { lkr: number; usd: number };

const lkr = (d: Deal) => (d.value != null ? Number(d.value) : 0);
const usd = (d: Deal) => (d.value_usd != null ? Number(d.value_usd) : 0);
const sumMoney = (deals: Deal[]): Money => ({
  lkr: deals.reduce((s, d) => s + lkr(d), 0),
  usd: deals.reduce((s, d) => s + usd(d), 0),
});

export function buildDashboardMetrics(input: MetricsInput) {
  const { now, deals, stages, clients, targets } = input;

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const open = deals.filter((d) => d.status === "OPEN");
  const won = deals.filter((d) => d.status === "WON");
  const lost = deals.filter((d) => d.status === "LOST");
  // Win rate counts every deal (open, won and lost) in the denominator.
  const totalDeals = deals.length;

  // ---- Yearly target ------------------------------------------------------------
  const year = colomboYear(now);
  const targetRow = targets.find((t) => t.year === year);
  const targetAmount = targetRow ? Number(targetRow.amount_lkr) : null;
  const targetAmountUsd = targetRow?.amount_usd != null ? Number(targetRow.amount_usd) : null;

  // ---- Pipeline by stage (current snapshot) -------------------------------------
  const stageRows = stages.map((s) => {
    const list = deals.filter((d) => d.stage_id === s.id);
    const total = sumMoney(list);
    return { name: s.name, kind: s.kind, count: list.length, value: total.lkr, valueUsd: total.usd };
  });

  // ---- Monthly won vs lost (Jan-Dec of the current year) ---------------------------------
  const closedMonth = (d: Deal) => (d.closed_at ? monthKey(new Date(d.closed_at)) : null);
  const trend = monthsOfYear(now).map((m) => {
    const wonInMonth = sumMoney(won.filter((d) => closedMonth(d) === m.key));
    const lostInMonth = sumMoney(lost.filter((d) => closedMonth(d) === m.key));
    return {
      label: m.label,
      wonValue: wonInMonth.lkr,
      wonValueUsd: wonInMonth.usd,
      lostValue: lostInMonth.lkr,
      lostValueUsd: lostInMonth.usd,
    };
  });

  // ---- Cumulative revenue vs target (current calendar year) ---------------------
  const currentMonthKey = monthKey(now);
  let running = 0;
  let runningUsd = 0;
  const cumulative = monthsOfYear(now).map((m, i) => {
    const wonInMonth = sumMoney(won.filter((d) => closedMonth(d) === m.key));
    running += wonInMonth.lkr;
    runningUsd += wonInMonth.usd;
    const reached = m.key <= currentMonthKey;
    return {
      label: m.label,
      actual: reached ? running : null,
      actualUsd: reached ? runningUsd : null,
      target: targetAmount != null ? (targetAmount * (i + 1)) / 12 : null,
      targetUsd: targetAmountUsd != null ? (targetAmountUsd * (i + 1)) / 12 : null,
    };
  });

  // ---- Clients ------------------------------------------------------------------
  const openClientIds = new Set(open.map((d) => d.client_id));
  const activeClients = clients.filter((c) => c.is_active);
  const valueByClient = (list: Deal[]) => {
    const map = new Map<string, number>();
    for (const d of list) map.set(d.client_id, (map.get(d.client_id) ?? 0) + lkr(d));
    return [...map.entries()]
      .filter(([, v]) => v > 0)
      .map(([id, value]) => ({ id, name: clientById.get(id)?.name ?? "-", value }))
      .sort((a, b) => b.value - a.value);
  };
  const wonByClient = valueByClient(won);

  return {
    open: { value: sumMoney(open) },
    headline: {
      wonValue: sumMoney(won),
      lostValue: sumMoney(lost),
      winRate: totalDeals > 0 ? (won.length / totalDeals) * 100 : null,
      wonCount: won.length,
      totalDeals,
    },
    target: { year, amount: targetAmount },
    stageRows,
    trend,
    cumulative,
    clients: {
      total: clients.length,
      active: activeClients.length,
      inactive: clients.length - activeClients.length,
      activeWithoutOpenDeals: activeClients.filter((c) => !openClientIds.has(c.id)).length,
      topByOpen: valueByClient(open).slice(0, 5),
      topByWon: wonByClient.slice(0, 5),
    },
  };
}

export type DashboardMetrics = ReturnType<typeof buildDashboardMetrics>;
