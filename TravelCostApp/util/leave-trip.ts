import {
  removeTravelerFromTrip,
  removeTripFromHistory as removeTripFromHistoryRemote,
} from "./http";
import {
  activateTrip,
  type ActivateTripDeps,
} from "./activate-trip";
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
  /**
   * Active trip promotion deps (sans uid). Used when leaving the Active trip
   * so `nextActiveTripId` is promoted through `activateTrip`.
   */
  activate?: Omit<ActivateTripDeps, "uid">;
};

export type LeaveTripResult = PlanTripLeaveResult & {
  /** True when roster + Trip history writes ran (plain leave only). */
  performed: boolean;
  /** Trip name after Active trip promotion; null when no promotion ran. */
  promotedTripName: string | null;
};

/**
 * Leave trip orchestration for the plain-leave path, including Active trip
 * promotion via `activateTrip` when the left trip was active.
 * Cascade-delete is planned but not executed here.
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
    return { ...plan, performed: false, promotedTripName: null };
  }

  let promotedTripName: string | null = null;

  // Promote first when leaving the Active trip so a failed activateTrip does
  // not leave the User without a valid Active trip after roster/history writes.
  if (plan.nextActiveTripId) {
    if (!deps.activate) {
      throw new Error(
        "leaveTrip: activate deps required to promote Active trip"
      );
    }
    const { tripData } = await activateTrip(plan.nextActiveTripId, {
      uid: deps.uid,
      ...deps.activate,
    });
    promotedTripName = tripData.tripName ?? null;
  }

  await removeTravelerFromTrip(tripid, deps.uid);
  await removeTripFromHistoryRemote(deps.uid, tripid);
  deps.removeFromTripHistoryLocal(tripid);

  return { ...plan, performed: true, promotedTripName };
}
