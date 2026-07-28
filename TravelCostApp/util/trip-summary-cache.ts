import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "../store/mmkv";

export type TripSummaryListItem = {
  tripid: string;
  tripname: string;
  selected: boolean;
};

/** Keep today's cache in sync after a rename without forcing a full refetch. */
export function updateTripNameInAllTripsCache(tripid: string, tripname: string) {
  const cached = getMMKVObject(
    MMKV_KEYS.ALL_TRIPS_AS_OBJECT
  ) as TripSummaryListItem[] | null;
  if (!cached?.length) return;
  const updated = cached.map((trip) =>
    trip.tripid === tripid ? { ...trip, tripname } : trip
  );
  setMMKVObject(MMKV_KEYS.ALL_TRIPS_AS_OBJECT, updated);
}

/** Prefer in-memory Active trip name when the daily cache is stale. */
export function patchActiveTripNameInList(
  trips: TripSummaryListItem[],
  activeTripId: string | undefined,
  activeTripName: string | undefined
): TripSummaryListItem[] {
  if (!activeTripId || !activeTripName?.trim()) return trips;
  return trips.map((trip) =>
    trip.tripid === activeTripId
      ? { ...trip, tripname: activeTripName }
      : trip
  );
}
