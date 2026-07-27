import {
  putTravelerInTrip,
  storeTrip,
  updateTripHistory,
  updateUser,
} from "./http";
import { getMMKVObject, MMKV_KEYS } from "../store/mmkv";
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../store/secure-storage";
import type { TripData } from "../types/trip";
import type { Traveller } from "./traveler";
import type { ExpenseData } from "./expense";
import {
  deviceLocaleTripCurrency,
  ensureImplicitDefaultActiveTrip,
} from "./implicit-default-trip";

type ImplicitDefaultAuthContexts = {
  uid: string;
  userName: string;
  existingTripHistory?: string[] | null;
  setCurrentTrip: (tripid: string, trip: TripData) => Promise<unknown>;
  saveTripDataInStorage: (tripData: TripData) => Promise<void>;
  saveTravellersInStorage: (travellers: Traveller[]) => Promise<unknown>;
  setExpenses: (expenses: ExpenseData[]) => void;
  setExpensesCache: (expenses: ExpenseData[]) => void;
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
    secureStoreGetItem,
    secureStoreSetItem,
    saveTripDataInStorage: ctx.saveTripDataInStorage,
    saveTravellersInStorage: ctx.saveTravellersInStorage,
    setExpenses: ctx.setExpenses,
    setExpensesCache: ctx.setExpensesCache,
    setFreshlyCreatedTo: ctx.setFreshlyCreatedTo,
    setTripHistory: ctx.setTripHistory,
  });
}
