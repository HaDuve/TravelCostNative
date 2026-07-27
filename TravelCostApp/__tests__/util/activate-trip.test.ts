import type { ExpenseData } from "../../util/expense";
import type { Traveller } from "../../util/traveler";
import type { TripData } from "../../types/trip";
import { activateTrip } from "../../util/activate-trip";

function tripX(): TripData {
  return {
    tripid: "trip-x",
    tripName: "Japan",
    totalBudget: "1000",
    dailyBudget: "50",
    tripCurrency: "EUR",
    travellers: [],
    startDate: "2026-01-01",
    endDate: "2026-01-10",
    isDynamicDailyBudget: false,
  };
}

function expense(id: string, description: string): ExpenseData {
  return {
    id,
    description,
    amount: 10,
    date: new Date("2026-01-02"),
    category: "food",
    currency: "EUR",
    uid: "u1",
  } as ExpenseData;
}

describe("activateTrip", () => {
  it("aligns secure id, server mirror, context, roster, and replaces expenses for trip X", async () => {
    const roster: Traveller[] = [
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ];
    const tripXExpenses = [expense("e-x1", "ramen")];
    const previousExpenses = [expense("e-old", "stale from trip-a")];

    let secureCurrentTripId: string | null = "trip-a";
    let serverCurrentTrip: string | null = "trip-a";
    let contextTrip: TripData | null = {
      tripid: "trip-a",
      tripName: "Old",
      tripCurrency: "EUR",
    };
    let contextTravellers: Traveller[] = [{ uid: "u9", userName: "Oldie" }];
    let expensesState = [...previousExpenses];
    let expensesCache: ExpenseData[] = [...previousExpenses];
    let freshlyCreated = true;

    await activateTrip("trip-x", {
      uid: "u1",
      fetchTrip: async () => tripX(),
      getTravellers: async () => roster,
      getAllExpenses: async () => tripXExpenses,
      updateUser: async (_uid, data) => {
        serverCurrentTrip = data.currentTrip ?? serverCurrentTrip;
      },
      secureStoreGetItem: async (key) =>
        key === "currentTripId" ? secureCurrentTripId : null,
      secureStoreSetItem: async (key, value) => {
        if (key === "currentTripId") secureCurrentTripId = value;
      },
      setCurrentTrip: async (tripid, trip) => {
        contextTrip = { ...trip, tripid };
        if (trip.travellers) {
          contextTravellers = trip.travellers as Traveller[];
        }
      },
      saveTripDataInStorage: async (trip) => {
        contextTrip = { ...(contextTrip ?? {}), ...trip };
      },
      saveTravellersInStorage: async (travellers) => {
        contextTravellers = travellers;
      },
      setExpenses: (expenses) => {
        expensesState = expenses;
      },
      setExpensesCache: (expenses) => {
        expensesCache = expenses;
      },
      setFreshlyCreatedTo: async (value) => {
        freshlyCreated = value;
      },
    });

    expect(secureCurrentTripId).toBe("trip-x");
    expect(serverCurrentTrip).toBe("trip-x");
    expect(contextTrip?.tripid).toBe("trip-x");
    expect(contextTrip?.tripName).toBe("Japan");
    expect(contextTravellers).toEqual(roster);
    expect(expensesState).toEqual(tripXExpenses);
    expect(expensesCache).toEqual(tripXExpenses);
    expect(expensesState.some((e) => e.id === "e-old")).toBe(false);
    expect(freshlyCreated).toBe(false);
  });

  it("surfaces failure and restores previous active trip id so stores do not disagree", async () => {
    let secureCurrentTripId: string | null = "trip-a";
    let serverCurrentTrip: string | null = "trip-a";
    let contextTrip: TripData | null = {
      tripid: "trip-a",
      tripName: "Old",
      tripCurrency: "EUR",
    };
    let expensesState = [expense("e-old", "stale")];
    const previousTrip: TripData = {
      tripid: "trip-a",
      tripName: "Old",
      tripCurrency: "EUR",
      travellers: [{ uid: "u9", userName: "Oldie" }],
    };
    const previousExpenses = [expense("e-old", "stale")];

    await expect(
      activateTrip("trip-x", {
        uid: "u1",
        fetchTrip: async () => tripX(),
        getTravellers: async () => [{ uid: "u1", userName: "Alice" }],
        getAllExpenses: async () => [expense("e-x1", "ramen")],
        updateUser: async (_uid, data) => {
          serverCurrentTrip = data.currentTrip ?? serverCurrentTrip;
        },
        secureStoreGetItem: async (key) =>
          key === "currentTripId" ? secureCurrentTripId : null,
        secureStoreSetItem: async (key, value) => {
          if (key === "currentTripId") secureCurrentTripId = value;
        },
        setCurrentTrip: async (tripid, trip) => {
          contextTrip = { ...trip, tripid };
        },
        saveTripDataInStorage: async () => {},
        saveTravellersInStorage: async () => {},
        setExpenses: (expenses) => {
          expensesState = expenses;
        },
        setExpensesCache: () => {
          throw new Error("cache write failed");
        },
        setFreshlyCreatedTo: async () => {},
        previousTripSnapshot: previousTrip,
        previousExpensesSnapshot: previousExpenses,
      })
    ).rejects.toThrow("cache write failed");

    expect(secureCurrentTripId).toBe("trip-a");
    expect(serverCurrentTrip).toBe("trip-a");
    expect(contextTrip?.tripid).toBe("trip-a");
    expect(expensesState).toEqual(previousExpenses);
  });

  it("replaces expenses with the full trip ledger, not a delta-sized subset", async () => {
    const fullLedger = [
      expense("e-x1", "ramen"),
      expense("e-x2", "hotel"),
      expense("e-x3", "train"),
    ];
    let requestedUseDelta: boolean | undefined;
    let expensesState = [expense("e-old", "stale from trip-a")];

    await activateTrip("trip-x", {
      uid: "u1",
      fetchTrip: async () => tripX(),
      getTravellers: async () => [{ uid: "u1", userName: "Alice" }],
      getAllExpenses: async (_tripid, _uid, useDelta) => {
        requestedUseDelta = useDelta;
        // Simulate a previously visited trip: delta would return only the newest row.
        return useDelta === false ? fullLedger : [fullLedger[2]];
      },
      updateUser: async () => {},
      secureStoreGetItem: async () => "trip-a",
      secureStoreSetItem: async () => {},
      setCurrentTrip: async () => {},
      saveTripDataInStorage: async () => {},
      saveTravellersInStorage: async () => {},
      setExpenses: (expenses) => {
        expensesState = expenses;
      },
      setExpensesCache: () => {},
      setFreshlyCreatedTo: async () => {},
    });

    expect(requestedUseDelta).toBe(false);
    expect(expensesState).toEqual(fullLedger);
    expect(expensesState).toHaveLength(3);
  });
});
