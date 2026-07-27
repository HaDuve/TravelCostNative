import * as Localization from "expo-localization";

import type { TripData } from "../types/trip";
import type { Category } from "./category";
import type { Traveller } from "./traveler";
import type { ExpenseData } from "./expense";
import { activateTrip } from "./activate-trip";

export function isImplicitDefaultTrip(
  trip: Pick<TripData, "isImplicitDefault"> | null | undefined
): boolean {
  return trip?.isImplicitDefault === true;
}

export function countsTowardNonPremiumTripLimit(
  trip: Pick<TripData, "isImplicitDefault"> | null | undefined
): boolean {
  if (!trip) return false;
  return !isImplicitDefaultTrip(trip);
}

export function countableTripsTowardNonPremiumLimit(
  trips: Array<Pick<TripData, "isImplicitDefault"> | null | undefined>
): number {
  return trips.filter(countsTowardNonPremiumTripLimit).length;
}

export function deviceLocaleTripCurrency(fallback = "EUR"): string {
  const locales = Localization.getLocales();
  const currencyCode = locales?.[0]?.currencyCode;
  return currencyCode && currencyCode.length > 0 ? currencyCode : fallback;
}

export function buildImplicitDefaultTripData(
  tripCurrency: string,
  categories?: Category[] | string | null
): TripData {
  const trip: TripData = {
    tripName: "",
    tripCurrency,
    totalBudget: "0",
    dailyBudget: "0",
    isDynamicDailyBudget: false,
    isImplicitDefault: true,
  };
  if (categories) {
    trip.categories =
      typeof categories === "string" ? categories : JSON.stringify(categories);
  }
  return trip;
}

export function mergeTripHistoryWithNewTrip(
  existingTripHistory: string[] | null | undefined,
  tripid: string
): string[] {
  const history = existingTripHistory ?? [];
  if (history.includes(tripid)) return [...history];
  return [...history, tripid];
}

export type EnsureImplicitDefaultActiveTripDeps = {
  uid: string;
  userName: string;
  tripCurrency: string;
  categories?: Category[] | string | null;
  existingTripHistory?: string[] | null;
  storeTrip: (tripData: TripData) => Promise<string>;
  putTravelerInTrip: (
    tripid: string,
    traveller: Traveller
  ) => Promise<unknown>;
  updateTripHistory: (userId: string, newTripid: string) => Promise<unknown>;
  updateUser: (
    userId: string,
    userData: {
      userName: string;
      currentTrip: string;
      freshlyCreated: boolean;
    }
  ) => Promise<unknown>;
  setCurrentTrip: (tripid: string, trip: TripData) => Promise<unknown>;
  secureStoreGetItem: (key: string) => Promise<string | null>;
  secureStoreSetItem: (key: string, value: string) => Promise<unknown>;
  saveTripDataInStorage: (tripData: TripData) => Promise<void>;
  saveTravellersInStorage: (travellers: Traveller[]) => Promise<unknown>;
  setExpenses: (expenses: ExpenseData[]) => void;
  setExpensesCache: (expenses: ExpenseData[]) => void;
  setFreshlyCreatedTo: (value: boolean) => void | Promise<unknown>;
  setTripHistory: (tripHistory: string[]) => void;
};

export async function ensureImplicitDefaultActiveTrip(
  deps: EnsureImplicitDefaultActiveTripDeps
): Promise<{ tripid: string; tripData: TripData }> {
  const tripData = buildImplicitDefaultTripData(
    deps.tripCurrency,
    deps.categories
  );
  const tripid = await deps.storeTrip(tripData);
  const tripWithId: TripData = { ...tripData, tripid };
  const nextHistory = mergeTripHistoryWithNewTrip(
    deps.existingTripHistory,
    tripid
  );
  const roster: Traveller[] = [
    { uid: deps.uid, userName: deps.userName },
  ];

  await deps.putTravelerInTrip(tripid, roster[0]);
  await deps.updateTripHistory(deps.uid, tripid);
  deps.setTripHistory(nextHistory);

  // Mirror writes (secure + server + context + empty ledger) go through activateTrip.
  const activated = await activateTrip(tripid, {
    uid: deps.uid,
    tripData: tripWithId,
    fetchTrip: async () => tripWithId,
    getTravellers: async () => roster,
    getAllExpenses: async () => [],
    updateUser: async (uid, data) => {
      await deps.updateUser(uid, {
        userName: deps.userName,
        currentTrip: data.currentTrip,
        freshlyCreated: false,
      });
    },
    secureStoreGetItem: deps.secureStoreGetItem,
    secureStoreSetItem: deps.secureStoreSetItem,
    setCurrentTrip: deps.setCurrentTrip,
    saveTripDataInStorage: deps.saveTripDataInStorage,
    saveTravellersInStorage: deps.saveTravellersInStorage,
    setExpenses: deps.setExpenses,
    setExpensesCache: deps.setExpensesCache,
    setFreshlyCreatedTo: deps.setFreshlyCreatedTo,
  });

  return { tripid: activated.tripid, tripData: activated.tripData };
}
