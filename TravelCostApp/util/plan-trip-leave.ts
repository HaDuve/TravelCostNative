import type { Traveller } from "./traveler";

export type TripLeaveMode = "leave" | "cascadeDelete";

export type TripLeaveWarning = "openBalances" | "permanentDelete";

export type PlanTripLeaveInput = {
  tripHistory: readonly string[];
  roster: readonly Pick<Traveller, "uid">[];
  /** Non-empty when the leaver has unresolved Balances on this trip. */
  openBalances: readonly unknown[];
  activeTripId: string | null | undefined;
  tripid: string;
};

export type PlanTripLeaveResult = {
  allowed: boolean;
  mode: TripLeaveMode;
  nextActiveTripId: string | null;
  warnings: TripLeaveWarning[];
};

/**
 * Pure Leave trip planner: last-trip guard, plain vs cascade mode,
 * Active trip promotion target, and warning flags. No I/O.
 */
export function planTripLeave(input: PlanTripLeaveInput): PlanTripLeaveResult {
  const { tripHistory, roster, openBalances, activeTripId, tripid } = input;

  const mode: TripLeaveMode =
    roster.length <= 1 ? "cascadeDelete" : "leave";

  const warnings: TripLeaveWarning[] = [];
  if (mode === "cascadeDelete") {
    warnings.push("permanentDelete");
  }
  if (openBalances.length > 0) {
    warnings.push("openBalances");
  }

  const allowed = tripHistory.length > 1;

  let nextActiveTripId: string | null = null;
  if (allowed && activeTripId === tripid) {
    nextActiveTripId =
      tripHistory.find((id) => id !== tripid) ?? null;
  }

  return {
    allowed,
    mode,
    nextActiveTripId,
    warnings,
  };
}
