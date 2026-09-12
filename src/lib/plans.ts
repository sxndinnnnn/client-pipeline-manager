import type { Plan } from "@/types/database";

export function isPlanActive(plan: Pick<Plan, "valid_to">, today = new Date()): boolean {
  if (!plan.valid_to) return true;
  return plan.valid_to >= today.toISOString().slice(0, 10);
}
