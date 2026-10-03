import type { PlanPlatform } from "@/types/database";

export const VALID_PLATFORMS: PlanPlatform[] = ["GPS", "TMS", "DVR", "HSC", "FMS"];

/** One platform on a plan or a deal: billed per unit or per shipment, with a quantity and prices. */
export type PriceLine = {
  platform: PlanPlatform;
  billing_basis: "UNITS" | "SHIPMENTS";
  quantity: number;
  price_lkr: number;
  price_usd: number;
};

export function selectedPlatforms(formData: FormData): PlanPlatform[] {
  return formData
    .getAll("platforms")
    .filter((p): p is string => typeof p === "string")
    .filter((p): p is PlanPlatform => (VALID_PLATFORMS as string[]).includes(p));
}

function numberField(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Reads one priced line per ticked platform from fields named qty_<P>, basis_<P>,
 * price_lkr_<P> and price_usd_<P>. A platform with all three numbers blank is left
 * unpriced; otherwise quantity and both prices are required.
 */
export function parseLines(formData: FormData, platforms: PlanPlatform[]): PriceLine[] {
  const lines: PriceLine[] = [];
  for (const platform of platforms) {
    const quantity = numberField(formData, `qty_${platform}`);
    const priceLkr = numberField(formData, `price_lkr_${platform}`);
    const priceUsd = numberField(formData, `price_usd_${platform}`);
    if (quantity == null && priceLkr == null && priceUsd == null) continue;
    if (quantity == null || priceLkr == null || priceUsd == null) {
      throw new Error(`${platform}: enter the quantity and both prices.`);
    }
    lines.push({
      platform,
      billing_basis: formData.get(`basis_${platform}`) === "SHIPMENTS" ? "SHIPMENTS" : "UNITS",
      quantity,
      price_lkr: priceLkr,
      price_usd: priceUsd,
    });
  }
  return lines;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Totals are always computed on the server so the client can't send different ones. */
export function totalsOf(lines: PriceLine[]) {
  return {
    amount_lkr: round2(lines.reduce((s, l) => s + l.quantity * l.price_lkr, 0)),
    amount_usd: round2(lines.reduce((s, l) => s + l.quantity * l.price_usd, 0)),
    units: round2(
      lines.filter((l) => l.billing_basis === "UNITS").reduce((s, l) => s + l.quantity, 0)
    ),
    shipments: round2(
      lines.filter((l) => l.billing_basis === "SHIPMENTS").reduce((s, l) => s + l.quantity, 0)
    ),
  };
}
