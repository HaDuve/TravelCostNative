import type { TripData } from "../types/trip";

export type JoinImplicitDefaultDecision =
  | { action: "none" }
  | { action: "promote"; tripid: string; tripName: string }
  | { action: "delete"; tripid: string };

export type ResolveJoinImplicitDefaultInput = {
  activeTripId: string | null | undefined;
  isImplicitDefault: boolean;
  expenseCount: number;
  joinedTripId: string;
  promotedTripName: string;
};

/** Decide promote vs silent-delete vs no-op when joining while on an implicit default. */
export function resolveJoinImplicitDefaultDecision(
  input: ResolveJoinImplicitDefaultInput
): JoinImplicitDefaultDecision {
  if (!input.isImplicitDefault || !input.activeTripId) {
    return { action: "none" };
  }
  if (input.activeTripId === input.joinedTripId) {
    return { action: "none" };
  }
  if (input.expenseCount > 0) {
    return {
      action: "promote",
      tripid: input.activeTripId,
      tripName: input.promotedTripName,
    };
  }
  return { action: "delete", tripid: input.activeTripId };
}

export function removeTripFromHistory(
  history: string[] | null | undefined,
  tripid: string
): string[] {
  return (history ?? []).filter((id) => id !== tripid);
}

export type ApplyJoinImplicitDefaultCleanupDeps = {
  uid: string;
  tripHistory: string[] | null | undefined;
  updateTrip: (
    tripid: string,
    tripData: Pick<TripData, "tripName" | "isImplicitDefault">
  ) => Promise<unknown>;
  deleteTrip: (tripid: string) => Promise<unknown>;
  storeTripHistory: (userId: string, tripHistory: string[]) => Promise<unknown>;
  setTripHistory: (tripHistory: string[]) => void;
};

export async function applyJoinImplicitDefaultCleanup(
  decision: JoinImplicitDefaultDecision,
  deps: ApplyJoinImplicitDefaultCleanupDeps
): Promise<void> {
  if (decision.action === "none") return;

  if (decision.action === "promote") {
    await deps.updateTrip(decision.tripid, {
      tripName: decision.tripName,
      isImplicitDefault: false,
    });
    return;
  }

  const nextHistory = removeTripFromHistory(deps.tripHistory, decision.tripid);
  await deps.deleteTrip(decision.tripid);
  await deps.storeTripHistory(deps.uid, nextHistory);
  deps.setTripHistory(nextHistory);
}
