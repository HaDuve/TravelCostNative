import {
  getMMKVObject,
  getMMKVString,
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";
import { TripData } from "../store/trip-context";

import { isToday } from "./date";
import { fetchTrip } from "./http";

export async function getTripData(tripid: string) {
  const cachedTrip = getMMKVObject(`trip_${tripid}`);
  const lastCacheUpdateTrip = getMMKVString(`lastUpdateISO_trip_${tripid}`);
  const lastUpdateWasTodayTrip =
    cachedTrip && lastCacheUpdateTrip && isToday(new Date(lastCacheUpdateTrip));
  const trip: TripData = lastUpdateWasTodayTrip
    ? cachedTrip
    : await fetchTrip(tripid);
  if (trip && !lastUpdateWasTodayTrip) {
    setMMKVString(`lastUpdateISO_trip_${tripid}`, new Date().toISOString());
    setMMKVObject(`trip_${tripid}`, trip);
  }
  return trip;
}
