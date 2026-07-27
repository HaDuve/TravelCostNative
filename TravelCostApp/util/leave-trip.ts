import {
  removeTravelerFromTrip,
  removeTripFromHistory as removeTripFromHistoryRemote,
} from "./http";
import {
  planTripLeave,
  type PlanTripLeaveResult,
} from "./plan-trip-leave";
import type { Traveller } from "./traveler";

export type LeaveTripDeps = {
  uid: string;
  tripHistory: readonly string[];
  roster: readonly Traveller[];
  openBalances?: readonly unknown[];
  activeTripId: string | null | undefined;
  /** Update Trip history state + local cache after a successful leave. */
  removeFromTripHistoryLocal: (tripid: string) => void;
};

export type LeaveTripResult = PlanTripLeaveResult & {
  /** True when roster + Trip history writes ran (plain leave only). */
  performed: boolean;
};

/**
 * Leave trip orchestration for the plain-leave path.
 * Cascade-delete and Active trip promotion are planned but not executed here.
 */
export async function leaveTrip(
  tripid: string,
  deps: LeaveTripDeps
): Promise<LeaveTripResult> {
  const plan = planTripLeave({
    tripHistory: deps.tripHistory,
    roster: deps.roster,
    openBalances: deps.openBalances ?? [],
    activeTripId: deps.activeTripId,
    tripid,
  });

  if (!plan.allowed || plan.mode !== "leave") {
    return { ...plan, performed: false };
  }

  await removeTravelerFromTrip(tripid, deps.uid);
  await removeTripFromHistoryRemote(deps.uid, tripid);
  deps.removeFromTripHistoryLocal(tripid);

  return { ...plan, performed: true };
}
