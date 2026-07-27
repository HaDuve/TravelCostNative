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
  openBalances?: readonly unknown[];
  activeTripId: string | null | undefined;
  /** Authoritative Traveller roster for the trip being left. */
  getTravellers: (tripid: string) => Promise<Traveller[]>;
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
  const roster = await deps.getTravellers(tripid);
  const plan = planTripLeave({
    tripHistory: deps.tripHistory,
    roster,
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
