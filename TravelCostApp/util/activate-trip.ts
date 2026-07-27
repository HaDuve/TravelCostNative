import type { TripData } from "../types/trip";
import type { ExpenseData } from "./expense";
import type { Traveller } from "./traveler";
import { hydrateTrip } from "./hydrate-trip";
import { normalizeTravellers } from "./normalize-travellers";

export type ActivateTripDeps = {
  uid: string;
  /** Optional already-known trip payload (e.g. just-saved form data). */
  tripData?: TripData;
  /** Prior Active trip fields — used to roll back context on partial failure. */
  previousTripSnapshot?: TripData | null;
  /** Prior expense set — restored on partial failure so the ledger does not drift. */
  previousExpensesSnapshot?: ExpenseData[] | null;
  fetchTrip: (tripid: string) => Promise<TripData>;
  getTravellers: (tripid: string) => Promise<Traveller[]>;
  getAllExpenses: (
    tripid: string,
    uid: string,
    useDelta?: boolean
  ) => Promise<ExpenseData[]>;
  updateUser: (
    uid: string,
    userData: { currentTrip: string }
  ) => Promise<unknown>;
  secureStoreGetItem: (key: string) => Promise<string | null>;
  secureStoreSetItem: (key: string, value: string) => Promise<unknown>;
  setCurrentTrip: (tripid: string, trip: TripData) => Promise<unknown>;
  saveTripDataInStorage: (tripData: TripData) => Promise<void>;
  saveTravellersInStorage: (travellers: Traveller[]) => Promise<unknown>;
  setExpenses: (expenses: ExpenseData[]) => void;
  setExpensesCache: (expenses: ExpenseData[]) => void;
  setFreshlyCreatedTo: (value: boolean) => void | Promise<unknown>;
};

/**
 * Owns the full Active trip transition: persist authoritative id, mirror to
 * server + TripContext, hydrate, load Traveller roster, replace expenses.
 * Partial failure restores prior secure/server/context/expenses so stores do
 * not disagree; the error is rethrown (not swallowed).
 */
export async function activateTrip(
  tripid: string,
  deps: ActivateTripDeps
): Promise<{ tripid: string; tripData: TripData }> {
  if (!tripid) {
    throw new Error("activateTrip requires a tripid");
  }

  const previousActiveTripId = await deps.secureStoreGetItem("currentTripId");

  const rawTrip = deps.tripData ?? (await deps.fetchTrip(tripid));
  if (!rawTrip) {
    throw new Error("activateTrip: trip not found");
  }

  const [rosterRaw, expenses] = await Promise.all([
    deps.getTravellers(tripid),
    // Full ledger required: replace must not apply a delta-sized subset.
    deps.getAllExpenses(tripid, deps.uid, false),
  ]);
  const roster = normalizeTravellers(rosterRaw);

  const hydratedTrip = hydrateTrip({
    ...rawTrip,
    tripid: rawTrip.tripid ?? tripid,
    travellers: roster,
  });

  let committed = false;
  try {
    await deps.secureStoreSetItem("currentTripId", tripid);
    await deps.updateUser(deps.uid, { currentTrip: tripid });
    await deps.setCurrentTrip(tripid, hydratedTrip);
    await deps.saveTripDataInStorage(hydratedTrip);
    await deps.saveTravellersInStorage(roster);
    deps.setExpenses(expenses);
    deps.setExpensesCache(expenses);
    await deps.setFreshlyCreatedTo(false);
    committed = true;

    return { tripid, tripData: hydratedTrip };
  } catch (error) {
    if (!committed) {
      await rollbackActivateTrip(tripid, previousActiveTripId, deps);
    }
    throw error;
  }
}

export type LastKnownActiveTrip = {
  tripData: TripData;
  roster: Traveller[];
  expenses: ExpenseData[];
};

/**
 * Offline / last-known boot: route through activateTrip with cached payloads
 * and a no-op server mirror so stores stay aligned without network.
 */
export async function activateTripFromLastKnown(
  tripid: string,
  lastKnown: LastKnownActiveTrip,
  deps: Omit<
    ActivateTripDeps,
    "tripData" | "fetchTrip" | "getTravellers" | "getAllExpenses" | "updateUser"
  > &
    Partial<Pick<ActivateTripDeps, "updateUser">>
): Promise<{ tripid: string; tripData: TripData }> {
  return activateTrip(tripid, {
    ...deps,
    tripData: lastKnown.tripData,
    fetchTrip: async () => lastKnown.tripData,
    getTravellers: async () => lastKnown.roster,
    getAllExpenses: async () => lastKnown.expenses,
    updateUser: deps.updateUser ?? (async () => {}),
  });
}

async function rollbackActivateTrip(
  attemptedTripid: string,
  previousActiveTripId: string | null,
  deps: ActivateTripDeps
): Promise<void> {
  if (!previousActiveTripId || previousActiveTripId === attemptedTripid) {
    return;
  }

  try {
    await deps.secureStoreSetItem("currentTripId", previousActiveTripId);
    await deps.updateUser(deps.uid, { currentTrip: previousActiveTripId });

    if (deps.previousTripSnapshot) {
      const previous = hydrateTrip({
        ...deps.previousTripSnapshot,
        tripid: deps.previousTripSnapshot.tripid ?? previousActiveTripId,
      });
      await deps.setCurrentTrip(previousActiveTripId, previous);
      await deps.saveTripDataInStorage(previous);
      const previousRoster = normalizeTravellers(previous.travellers);
      await deps.saveTravellersInStorage(previousRoster);
    }

    if (deps.previousExpensesSnapshot) {
      deps.setExpenses(deps.previousExpensesSnapshot);
      deps.setExpensesCache(deps.previousExpensesSnapshot);
    }
  } catch {
    // Best-effort rollback; original error still surfaces to the caller.
  }
}
