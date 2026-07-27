import * as Localization from "expo-localization";

import type { TripData } from "../types/trip";
import type { Category } from "./category";
import type { Traveller } from "./traveler";

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
  secureStoreSetItem: (key: string, value: string) => Promise<unknown>;
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

  await deps.putTravelerInTrip(tripid, {
    uid: deps.uid,
    userName: deps.userName,
  });
  await deps.secureStoreSetItem("currentTripId", tripid);
  await deps.updateTripHistory(deps.uid, tripid);
  await deps.updateUser(deps.uid, {
    userName: deps.userName,
    currentTrip: tripid,
    freshlyCreated: false,
  });
  await deps.setCurrentTrip(tripid, tripWithId);
  deps.setTripHistory(nextHistory);
  await deps.setFreshlyCreatedTo(false);

  return { tripid, tripData: tripWithId };
}
