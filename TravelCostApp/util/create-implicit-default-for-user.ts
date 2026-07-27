import {
  putTravelerInTrip,
  storeTrip,
  updateTripHistory,
  updateUser,
} from "./http";
import { getMMKVObject, MMKV_KEYS } from "../store/mmkv";
import { secureStoreSetItem } from "../store/secure-storage";
import type { TripData } from "../types/trip";
import {
  deviceLocaleTripCurrency,
  ensureImplicitDefaultActiveTrip,
} from "./implicit-default-trip";

type ImplicitDefaultAuthContexts = {
  uid: string;
  userName: string;
  existingTripHistory?: string[] | null;
  setCurrentTrip: (tripid: string, trip: TripData) => Promise<unknown>;
  setFreshlyCreatedTo: (value: boolean) => void | Promise<unknown>;
  setTripHistory: (tripHistory: string[]) => void;
};

/** Shared Login/Signup adapter for silent implicit default Active trip creation. */
export async function createImplicitDefaultForUser(
  ctx: ImplicitDefaultAuthContexts
) {
  return ensureImplicitDefaultActiveTrip({
    uid: ctx.uid,
    userName: ctx.userName,
    tripCurrency: deviceLocaleTripCurrency(),
    categories: getMMKVObject(MMKV_KEYS.CATEGORY_LIST),
    existingTripHistory: ctx.existingTripHistory,
    storeTrip,
    putTravelerInTrip,
    updateTripHistory,
    updateUser,
    setCurrentTrip: ctx.setCurrentTrip,
    secureStoreSetItem,
    setFreshlyCreatedTo: ctx.setFreshlyCreatedTo,
    setTripHistory: ctx.setTripHistory,
  });
}
