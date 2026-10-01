import type {
  Deal,
  DealStageEvent,
  Plan,
  PipelineStage,
  SalesTarget,
} from "@/types/database";
import { lostReasonCategory } from "@/lib/loss-reasons";
import {
  colomboYear,
  inRange,
  monthKey,
  monthsOfYear,
  pctChange,
  trailingMonths,
  type DateRange,
  type ResolvedPeriod,
} from "./period";

export const STALE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const SYSTEM_NOTE_PREFIX = "Deal moved to stage:";

export type ClientLite = {
  id: string;
  name: string;
  industry: string | null;
  is_active: boolean;
  created_at: string;
};
export type ActivityLite = {
  deal_id: string;
  author_id: string | null;
  created_at: string;
  content: string;
};
export type ProfileLite = { id: string; name: string | null; email: string | null };

export type MetricsInput = {
  now: Date;
  period: ResolvedPeriod;
  deals: Deal[];
  stages: PipelineStage[];
  clients: ClientLite[];
  plans: Plan[];
  activities: ActivityLite[];
  events: DealStageEvent[];
  profiles: ProfileLite[];
  targets: SalesTarget[];
};

type Money = { lkr: number; usd: number };

const lkr = (d: Deal) => (d.value != null ? Number(d.value) : 0);
const usd = (d: Deal) => (d.value_usd != null ? Number(d.value_usd) : 0);
const sumMoney = (deals: Deal[]): Money => ({
  lkr: deals.reduce((s, d) => s + lkr(d), 0),
  usd: deals.reduce((s, d) => s + usd(d), 0),
});
const mean = (nums: number[]) =>
  nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null;

/** Everything that happened to deals and clients inside one date range. */
function periodStats(range: DateRange, deals: Deal[], clients: ClientLite[]) {
  const won = deals.filter((d) => d.status === "WON" && inRange(d.closed_at, range));
  const lost = deals.filter((d) => d.status === "LOST" && inRange(d.closed_at, range));
  const decided = won.length + lost.length;
  const cycleDays = won
    .filter((d) => d.closed_at)
    .map((d) => (new Date(d.closed_at!).getTime() - new Date(d.created_at).getTime()) / DAY_MS);
  const wonValuesLkr = won.map(lkr).filter((v) => v > 0);

  return {
    won,
    lost,
    wonValue: sumMoney(won),
    lostValue: sumMoney(lost),
    avgWonSize: mean(wonValuesLkr),
    winRate: decided > 0 ? (won.length / decided) * 100 : null,
    newDeals: deals.filter((d) => inRange(d.created_at, range)).length,
    avgCycleDays: mean(cycleDays),
    newClients: clients.filter((c) => inRange(c.created_at, range)).length,
  };
}

export type Delta = { pct: number | null; points: number | null };

/** Relative change, for amounts and counts. */
function relDelta(cur: number | null, prev: number | null): Delta | null {
  if (cur == null || prev == null) return null;
  return { pct: pctChange(cur, prev), points: null };
}
/** Absolute point change, for rates. */
function pointDelta(cur: number | null, prev: number | null): Delta | null {
  if (cur == null || prev == null) return null;
  return { pct: null, points: cur - prev };
}

export type GroupRow = {
  name: string;
  won: number;
  lost: number;
  wonValue: number;
  winRate: number | null;
};

function groupBy(closedWon: Deal[], closedLost: Deal[], keyOf: (d: Deal) => string): GroupRow[] {
  const map = new Map<string, GroupRow>();
  const row = (name: string) => {
    let r = map.get(name);
    if (!r) {
      r = { name, won: 0, lost: 0, wonValue: 0, winRate: null };
      map.set(name, r);
    }
    return r;
  };
  for (const d of closedWon) {
    const r = row(keyOf(d));
    r.won += 1;
    r.wonValue += lkr(d);
  }
  for (const d of closedLost) row(keyOf(d)).lost += 1;
  const rows = [...map.values()];
  for (const r of rows) r.winRate = r.won + r.lost > 0 ? (r.won / (r.won + r.lost)) * 100 : null;
  return rows.sort((a, b) => b.wonValue - a.wonValue || b.won - a.won);
}

export function buildDashboardMetrics(input: MetricsInput) {
  const { now, period, deals, stages, clients, plans, activities, events, profiles, targets } = input;

  const stageById = new Map(stages.map((s) => [s.id, s]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const planById = new Map(plans.map((p) => [p.id, p]));

  const open = deals.filter((d) => d.status === "OPEN");
  const cur = periodStats(period.current, deals, clients);
  const prev = period.previous ? periodStats(period.previous, deals, clients) : null;

  // ---- Open pipeline snapshot ---------------------------------------------------
  const openValue = sumMoney(open);
  const weighted = open.reduce(
    (s, d) => s + lkr(d) * ((stageById.get(d.stage_id ?? "")?.win_probability ?? 0) / 100),
    0,
  );

  // ---- Yearly target ------------------------------------------------------------
  const year = colomboYear(now);
  const yearRange: DateRange = {
    start: new Date(Date.UTC(year, 0, 1) - COLOMBO_OFFSET_MS),
    end: new Date(Date.UTC(year + 1, 0, 1) - COLOMBO_OFFSET_MS),
  };
  const targetRow = targets.find((t) => t.year === year);
  const targetAmount = targetRow ? Number(targetRow.amount_lkr) : null;
  const wonThisYear = deals
    .filter((d) => d.status === "WON" && inRange(d.closed_at, yearRange))
    .reduce((s, d) => s + lkr(d), 0);
  const remainingTarget = targetAmount != null ? Math.max(targetAmount - wonThisYear, 0) : null;
  const coverage =
    remainingTarget != null && remainingTarget > 0 ? openValue.lkr / remainingTarget : null;

  // ---- Stage history lookups ----------------------------------------------------
  const eventsByDeal = new Map<string, DealStageEvent[]>();
  for (const e of events) {
    const list = eventsByDeal.get(e.deal_id);
    if (list) list.push(e);
    else eventsByDeal.set(e.deal_id, [e]);
  }
  for (const list of eventsByDeal.values()) {
    list.sort((a, b) => new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime());
  }

  // ---- Pipeline by stage (current snapshot) -------------------------------------
  const stageRows = stages.map((s) => {
    const list = deals.filter((d) => d.stage_id === s.id);
    return { name: s.name, count: list.length, value: sumMoney(list).lkr };
  });

  // ---- Conversion funnel --------------------------------------------------------
  // A deal "reached" a stage if it ever entered that stage or any later one, so a
  // deal dragged straight from Lead to Won still counts for the stages it skipped.
  const funnelStages = stages.filter((s) => s.kind !== "LOST");
  const reachedOrders: number[] = [];
  for (const d of deals) {
    let max = -1;
    for (const e of eventsByDeal.get(d.id) ?? []) {
      const s = stageById.get(e.stage_id);
      if (s && s.kind !== "LOST") max = Math.max(max, s.sort_order);
    }
    const currentStage = stageById.get(d.stage_id ?? "");
    if (currentStage && currentStage.kind !== "LOST") max = Math.max(max, currentStage.sort_order);
    if (max >= 0) reachedOrders.push(max);
  }
  const funnelCounts = funnelStages.map((s) => ({
    name: s.name,
    count: reachedOrders.filter((m) => m >= s.sort_order).length,
  }));
  const funnelRows = funnelCounts.map((row, i) => {
    const first = funnelCounts[0]?.count ?? 0;
    const prevCount = i > 0 ? funnelCounts[i - 1].count : null;
    return {
      name: row.name,
      count: row.count,
      pctOfFirst: first > 0 ? (row.count / first) * 100 : null,
      stepConversion: prevCount != null && prevCount > 0 ? (row.count / prevCount) * 100 : null,
    };
  });

  // ---- Stale open deals ---------------------------------------------------------
  const lastActivityByDeal = new Map<string, number>();
  for (const a of activities) {
    const t = new Date(a.created_at).getTime();
    if (t > (lastActivityByDeal.get(a.deal_id) ?? 0)) lastActivityByDeal.set(a.deal_id, t);
  }
  const staleDeals = open
    .map((d) => {
      const lastEvent = (eventsByDeal.get(d.id) ?? []).at(-1);
      const lastTouch = Math.max(
        new Date(d.created_at).getTime(),
        lastActivityByDeal.get(d.id) ?? 0,
        lastEvent ? new Date(lastEvent.entered_at).getTime() : 0,
      );
      return {
        id: d.id,
        title: d.title,
        client: clientById.get(d.client_id)?.name ?? "-",
        stage: stageById.get(d.stage_id ?? "")?.name ?? "-",
        value: lkr(d),
        idleDays: Math.floor((now.getTime() - lastTouch) / DAY_MS),
      };
    })
    .filter((d) => d.idleDays >= STALE_DAYS)
    .sort((a, b) => b.idleDays - a.idleDays);

  // ---- Monthly trends (trailing 12 months) --------------------------------------
  const closedMonth = (d: Deal) => (d.closed_at ? monthKey(new Date(d.closed_at)) : null);
  const trend = trailingMonths(now, 12).map((m) => {
    const won = deals.filter((d) => d.status === "WON" && closedMonth(d) === m.key);
    const lost = deals.filter((d) => d.status === "LOST" && closedMonth(d) === m.key);
    const decided = won.length + lost.length;
    return {
      label: m.label,
      wonValue: sumMoney(won).lkr,
      lostValue: sumMoney(lost).lkr,
      created: deals.filter((d) => monthKey(new Date(d.created_at)) === m.key).length,
      closed: decided,
      winRate: decided > 0 ? (won.length / decided) * 100 : 0,
    };
  });

  // ---- Cumulative revenue vs target (current calendar year) ---------------------
  const currentMonthKey = monthKey(now);
  let running = 0;
  const cumulative = monthsOfYear(now).map((m, i) => {
    running += deals
      .filter((d) => d.status === "WON" && closedMonth(d) === m.key)
      .reduce((s, d) => s + lkr(d), 0);
    return {
      label: m.label,
      actual: m.key <= currentMonthKey ? running : null,
      target: targetAmount != null ? (targetAmount * (i + 1)) / 12 : null,
    };
  });

  // ---- Loss analysis (selected period) ------------------------------------------
  const reasonCounts = new Map<string, number>();
  const lostAtCounts = new Map<string, number>();
  for (const d of cur.lost) {
    const reason = lostReasonCategory(d.lost_reason);
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);

    const lastLiveStage = [...(eventsByDeal.get(d.id) ?? [])]
      .reverse()
      .map((e) => stageById.get(e.stage_id))
      .find((s) => s && s.kind !== "LOST");
    const at = lastLiveStage?.name ?? "Unknown";
    lostAtCounts.set(at, (lostAtCounts.get(at) ?? 0) + 1);
  }
  const toSortedRows = (m: Map<string, number>) =>
    [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // ---- Clients ------------------------------------------------------------------
  const openClientIds = new Set(open.map((d) => d.client_id));
  const activeClients = clients.filter((c) => c.is_active);
  const wonAll = deals.filter((d) => d.status === "WON");
  const valueByClient = (list: Deal[]) => {
    const map = new Map<string, number>();
    for (const d of list) map.set(d.client_id, (map.get(d.client_id) ?? 0) + lkr(d));
    return [...map.entries()]
      .filter(([, v]) => v > 0)
      .map(([id, value]) => ({ id, name: clientById.get(id)?.name ?? "-", value }))
      .sort((a, b) => b.value - a.value);
  };
  const wonByClient = valueByClient(wonAll);
  const totalWonAll = wonByClient.reduce((s, c) => s + c.value, 0);
  const top3Share =
    totalWonAll > 0
      ? (wonByClient.slice(0, 3).reduce((s, c) => s + c.value, 0) / totalWonAll) * 100
      : null;

  // ---- Plans and industries (selected period) -----------------------------------
  const byPlan = groupBy(cur.won, cur.lost, (d) => planById.get(d.plan_id ?? "")?.name ?? "No plan");
  const byIndustry = groupBy(
    cur.won,
    cur.lost,
    (d) => clientById.get(d.client_id)?.industry?.trim() || "Unspecified",
  );

  // Same rule as the Gain/Loss report: below the plan price is a loss, at/above a gain.
  let netVsPlanLkr = 0;
  let netVsPlanUsd = 0;
  let belowPlan = 0;
  let comparable = 0;
  for (const d of cur.won) {
    const plan = planById.get(d.plan_id ?? "");
    if (plan?.amount_lkr != null && d.value != null) {
      const diff = Number(d.value) - Number(plan.amount_lkr);
      netVsPlanLkr += diff;
      comparable += 1;
      if (diff < 0) belowPlan += 1;
    }
    if (plan?.amount_usd != null && d.value_usd != null) {
      netVsPlanUsd += Number(d.value_usd) - Number(plan.amount_usd);
    }
  }

  // ---- Team ---------------------------------------------------------------------
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const teamMap = new Map<
    string,
    {
      id: string;
      name: string;
      activities: number;
      openDeals: number;
      openValue: number;
      won: number;
      wonValue: number;
    }
  >();
  const person = (id: string | null) => {
    const key = id ?? "none";
    let p = teamMap.get(key);
    if (!p) {
      const profile = id ? profileById.get(id) : undefined;
      p = {
        id: key,
        name: profile?.name || profile?.email || (id ? "Unknown user" : "Unassigned"),
        activities: 0,
        openDeals: 0,
        openValue: 0,
        won: 0,
        wonValue: 0,
      };
      teamMap.set(key, p);
    }
    return p;
  };
  for (const a of activities) {
    if (a.content.startsWith(SYSTEM_NOTE_PREFIX) || !inRange(a.created_at, period.current)) continue;
    person(a.author_id).activities += 1;
  }
  for (const d of open) {
    const p = person(d.owner_id);
    p.openDeals += 1;
    p.openValue += lkr(d);
  }
  for (const d of cur.won) {
    const p = person(d.owner_id);
    p.won += 1;
    p.wonValue += lkr(d);
  }
  const team = [...teamMap.values()].sort(
    (a, b) => b.wonValue - a.wonValue || b.activities - a.activities,
  );

  return {
    open: {
      count: open.length,
      value: openValue,
      withoutValue: open.filter((d) => d.value == null).length,
      weighted,
    },
    headline: {
      wonValue: cur.wonValue,
      wonCount: cur.won.length,
      wonClients: new Set(cur.won.map((d) => d.client_id)).size,
      totalClients: clients.length,
      lostCount: cur.lost.length,
      lostValue: cur.lostValue,
      winRate: cur.winRate,
      avgWonSize: cur.avgWonSize,
      newDeals: cur.newDeals,
      avgCycleDays: cur.avgCycleDays,
      newClients: cur.newClients,
      deltas: prev
        ? {
            wonValue: relDelta(cur.wonValue.lkr, prev.wonValue.lkr),
            winRate: pointDelta(cur.winRate, prev.winRate),
            avgWonSize: relDelta(cur.avgWonSize, prev.avgWonSize),
            newDeals: relDelta(cur.newDeals, prev.newDeals),
            avgCycleDays: relDelta(cur.avgCycleDays, prev.avgCycleDays),
            newClients: relDelta(cur.newClients, prev.newClients),
            lostValue: relDelta(cur.lostValue.lkr, prev.lostValue.lkr),
          }
        : null,
    },
    target: {
      year,
      amount: targetAmount,
      wonThisYear,
      remaining: remainingTarget,
      coverage,
    },
    stageRows,
    funnelRows,
    staleDeals,
    staleValue: staleDeals.reduce((s, d) => s + d.value, 0),
    trend,
    cumulative,
    loss: { reasons: toSortedRows(reasonCounts), lostAt: toSortedRows(lostAtCounts) },
    clients: {
      total: clients.length,
      active: activeClients.length,
      inactive: clients.length - activeClients.length,
      activeWithoutOpenDeals: activeClients.filter((c) => !openClientIds.has(c.id)).length,
      topByOpen: valueByClient(open).slice(0, 5),
      topByWon: wonByClient.slice(0, 5),
      top3Share,
    },
    byPlan,
    byIndustry,
    planVariance: { netLkr: netVsPlanLkr, netUsd: netVsPlanUsd, belowPlan, comparable },
    team,
  };
}

export type DashboardMetrics = ReturnType<typeof buildDashboardMetrics>;
