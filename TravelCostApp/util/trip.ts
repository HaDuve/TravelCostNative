import {
  getMMKVObject,
  getMMKVString,
  MMKV_KEY_PATTERNS,
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";
import type { TripData } from "../types/trip";
import { isToday } from "./date";
import { fetchTrip } from "./http";
import { hasPoisonedTripMetadata } from "./trip-metadata";

export async function getTripData(tripid: string) {
  const cachedTrip = getMMKVObject(MMKV_KEY_PATTERNS.TRIP(tripid));
  const lastCacheUpdateTrip = getMMKVString(
    MMKV_KEY_PATTERNS.TRIP_LAST_UPDATE_ISO(tripid)
  );
  const cacheIsFreshToday =
    !!cachedTrip &&
    !!lastCacheUpdateTrip &&
    isToday(new Date(lastCacheUpdateTrip)) &&
    !hasPoisonedTripMetadata(cachedTrip);
  const trip: TripData = cacheIsFreshToday
    ? cachedTrip
    : await fetchTrip(tripid);
  if (trip && !cacheIsFreshToday) {
    setMMKVString(
      MMKV_KEY_PATTERNS.TRIP_LAST_UPDATE_ISO(tripid),
      new Date().toISOString()
    );
    setMMKVObject(MMKV_KEY_PATTERNS.TRIP(tripid), trip);
  }
  return trip;
}
