import type { Deal, PipelineStage, SalesTarget } from "@/types/database";
import {
  colomboYear,
  monthKey,
  monthsOfYear,
  trailingMonths,
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
  const decided = won.length + lost.length;

  // ---- Yearly target ------------------------------------------------------------
  const year = colomboYear(now);
  const targetRow = targets.find((t) => t.year === year);
  const targetAmount = targetRow ? Number(targetRow.amount_lkr) : null;

  // ---- Pipeline by stage (current snapshot) -------------------------------------
  const stageRows = stages.map((s) => {
    const list = deals.filter((d) => d.stage_id === s.id);
    return { name: s.name, count: list.length, value: sumMoney(list).lkr };
  });

  // ---- Monthly won vs lost (trailing 12 months) ---------------------------------
  const closedMonth = (d: Deal) => (d.closed_at ? monthKey(new Date(d.closed_at)) : null);
  const trend = trailingMonths(now, 12).map((m) => ({
    label: m.label,
    wonValue: sumMoney(won.filter((d) => closedMonth(d) === m.key)).lkr,
    lostValue: sumMoney(lost.filter((d) => closedMonth(d) === m.key)).lkr,
  }));

  // ---- Cumulative revenue vs target (current calendar year) ---------------------
  const currentMonthKey = monthKey(now);
  let running = 0;
  const cumulative = monthsOfYear(now).map((m, i) => {
    running += won.filter((d) => closedMonth(d) === m.key).reduce((s, d) => s + lkr(d), 0);
    return {
      label: m.label,
      actual: m.key <= currentMonthKey ? running : null,
      target: targetAmount != null ? (targetAmount * (i + 1)) / 12 : null,
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
  const totalWon = wonByClient.reduce((s, c) => s + c.value, 0);
  const top3Share =
    totalWon > 0
      ? (wonByClient.slice(0, 3).reduce((s, c) => s + c.value, 0) / totalWon) * 100
      : null;

  return {
    open: { value: sumMoney(open) },
    headline: {
      wonValue: sumMoney(won),
      lostValue: sumMoney(lost),
      winRate: decided > 0 ? (won.length / decided) * 100 : null,
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
      top3Share,
    },
  };
}

export type DashboardMetrics = ReturnType<typeof buildDashboardMetrics>;
