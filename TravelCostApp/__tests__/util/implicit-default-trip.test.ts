import type { TripData } from "../../types/trip";
import {
  buildImplicitDefaultTripData,
  countsTowardNonPremiumTripLimit,
  countableTripsTowardNonPremiumLimit,
  ensureImplicitDefaultActiveTrip,
  isImplicitDefaultTrip,
} from "../../util/implicit-default-trip";

describe("isImplicitDefaultTrip", () => {
  it("treats missing isImplicitDefault as false", () => {
    const trip: TripData = { tripName: "Legacy", tripCurrency: "EUR" };
    expect(isImplicitDefaultTrip(trip)).toBe(false);
  });

  it("treats explicit false as false", () => {
    expect(isImplicitDefaultTrip({ isImplicitDefault: false })).toBe(false);
  });

  it("treats true as true", () => {
    expect(isImplicitDefaultTrip({ isImplicitDefault: true })).toBe(true);
  });
});

describe("buildImplicitDefaultTripData", () => {
  it("builds an implicit default trip with locale currency, zero budgets, and no dates", () => {
    const trip = buildImplicitDefaultTripData("JPY");

    expect(trip.isImplicitDefault).toBe(true);
    expect(trip.tripCurrency).toBe("JPY");
    expect(trip.totalBudget).toBe("0");
    expect(trip.dailyBudget).toBe("0");
    expect(trip.startDate).toBeUndefined();
    expect(trip.endDate).toBeUndefined();
    expect(trip.tripName).toBe("");
    expect(trip.isDynamicDailyBudget).toBe(false);
  });
});

describe("non-premium trip limit counting", () => {
  it("excludes implicit default trips from the countable total", () => {
    const trips: TripData[] = [
      { isImplicitDefault: true, tripCurrency: "EUR" },
      { isImplicitDefault: false, tripCurrency: "EUR" },
      { tripCurrency: "USD" },
    ];

    expect(countableTripsTowardNonPremiumLimit(trips)).toBe(2);
    expect(countsTowardNonPremiumTripLimit(trips[0])).toBe(false);
    expect(countsTowardNonPremiumTripLimit(trips[1])).toBe(true);
    expect(countsTowardNonPremiumTripLimit(trips[2])).toBe(true);
  });

  it("does not count failed trip fetches against the limit", () => {
    expect(countsTowardNonPremiumTripLimit(null)).toBe(false);
    expect(countableTripsTowardNonPremiumLimit([null, undefined])).toBe(0);
  });
});

describe("ensureImplicitDefaultActiveTrip", () => {
  it("stores an implicit default trip, sets Active trip, and clears freshlyCreated", async () => {
    const storeTrip = jest.fn(async () => "trip-implicit-1");
    const putTravelerInTrip = jest.fn(async () => ({}));
    const storeTripHistory = jest.fn(async () => undefined);
    const updateUser = jest.fn(async () => undefined);
    const setCurrentTrip = jest.fn(async () => undefined);
    const secureStoreSetItem = jest.fn(async () => undefined);
    const setFreshlyCreatedTo = jest.fn(async () => undefined);
    const setTripHistory = jest.fn();

    const result = await ensureImplicitDefaultActiveTrip({
      uid: "u1",
      userName: "Alice",
      tripCurrency: "EUR",
      storeTrip,
      putTravelerInTrip,
      storeTripHistory,
      updateUser,
      setCurrentTrip,
      secureStoreSetItem,
      setFreshlyCreatedTo,
      setTripHistory,
    });

    expect(storeTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        isImplicitDefault: true,
        tripCurrency: "EUR",
        totalBudget: "0",
        dailyBudget: "0",
        tripName: "",
      })
    );
    expect(putTravelerInTrip).toHaveBeenCalledWith("trip-implicit-1", {
      uid: "u1",
      userName: "Alice",
    });
    expect(secureStoreSetItem).toHaveBeenCalledWith(
      "currentTripId",
      "trip-implicit-1"
    );
    expect(storeTripHistory).toHaveBeenCalledWith("u1", ["trip-implicit-1"]);
    expect(updateUser).toHaveBeenCalledWith("u1", {
      userName: "Alice",
      currentTrip: "trip-implicit-1",
      freshlyCreated: false,
    });
    expect(setCurrentTrip).toHaveBeenCalledWith(
      "trip-implicit-1",
      expect.objectContaining({
        isImplicitDefault: true,
        tripCurrency: "EUR",
        tripid: "trip-implicit-1",
      })
    );
    expect(setTripHistory).toHaveBeenCalledWith(["trip-implicit-1"]);
    expect(setFreshlyCreatedTo).toHaveBeenCalledWith(false);
    expect(result.tripid).toBe("trip-implicit-1");
    expect(result.tripData.isImplicitDefault).toBe(true);
  });
});
