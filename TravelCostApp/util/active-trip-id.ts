import { secureStoreGetItem } from "../store/secure-storage";

/** Secure-store key for the authoritative Active trip id. */
export const ACTIVE_TRIP_ID_KEY = "currentTripId";

export type GetActiveTripIdDeps = {
  secureStoreGetItem: (
    key: string
  ) => Promise<string | null | undefined>;
};

/**
 * Resolves the Active trip id from secure storage — the single source of truth.
 * Server `currentTrip` and `TripContext.tripid` are mirrors updated through
 * `activateTrip` (see docs/adr/0001-authoritative-active-trip-id.md).
 */
export async function getActiveTripId(
  deps?: GetActiveTripIdDeps
): Promise<string | null> {
  const read = deps?.secureStoreGetItem ?? secureStoreGetItem;
  const id = await read(ACTIVE_TRIP_ID_KEY);
  if (!id || id.trim() === "") return null;
  return id;
}
