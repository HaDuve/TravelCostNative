import {
  getMMKVObject,
  getMMKVString,
  MMKV_KEY_PATTERNS,
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";
import { TripData } from "../store/trip-context";
import { isToday } from "./date";
import { fetchTrip } from "./http";

export async function getTripData(tripid: string) {
  const cachedTrip = getMMKVObject(MMKV_KEY_PATTERNS.TRIP(tripid));
  const lastCacheUpdateTrip = getMMKVString(
    MMKV_KEY_PATTERNS.TRIP_LAST_UPDATE_ISO(tripid)
  );
  const lastUpdateWasTodayTrip =
    cachedTrip && lastCacheUpdateTrip && isToday(new Date(lastCacheUpdateTrip));
  const trip: TripData = lastUpdateWasTodayTrip
    ? cachedTrip
    : await fetchTrip(tripid);
  if (trip && !lastUpdateWasTodayTrip) {
    setMMKVString(
      MMKV_KEY_PATTERNS.TRIP_LAST_UPDATE_ISO(tripid),
      new Date().toISOString()
    );
    setMMKVObject(MMKV_KEY_PATTERNS.TRIP(tripid), trip);
  }
  return trip;
}
