import type { Activity, ActivityType } from "@/types/database";

/** Activity types people log by hand. "note" is reserved for system stage-move records. */
export const LOGGED_ACTIVITY_TYPES = ["call", "email", "meeting"] as const satisfies readonly ActivityType[];

/** move_deal_stage() records each pipeline move as a note starting with this text. */
const STAGE_MOVE_PREFIX = "Deal moved to stage: ";

export type StageMove = { id: string; stage: string; created_at: string };

/** Splits a deal's activity rows into logged activities and pipeline movements. */
export function splitActivities(activities: Activity[]): {
  logged: Activity[];
  moves: StageMove[];
} {
  const logged: Activity[] = [];
  const moves: StageMove[] = [];
  for (const a of activities) {
    if (a.type === "note" && a.content.startsWith(STAGE_MOVE_PREFIX)) {
      moves.push({ id: a.id, stage: a.content.slice(STAGE_MOVE_PREFIX.length), created_at: a.created_at });
    } else if ((LOGGED_ACTIVITY_TYPES as readonly string[]).includes(a.type)) {
      logged.push(a);
    }
  }
  return { logged, moves };
}
