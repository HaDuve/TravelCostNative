import type { ExpenseData } from "../../util/expense";
import type { Traveller } from "../../util/traveler";
import type { TripData } from "../../types/trip";
import {
  activateTrip,
  activateTripFromLastKnown,
} from "../../util/activate-trip";

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

type StoreProbe = {
  secureCurrentTripId: string | null;
  serverCurrentTrip: string | null;
  contextTrip: TripData | null;
  contextTravellers: Traveller[];
  expensesState: ExpenseData[];
  expensesCache: ExpenseData[];
  updateUserCalls: Array<{ currentTrip: string }>;
  setCurrentTripCalls: string[];
};

function emptyProbe(prior?: Partial<StoreProbe>): StoreProbe {
  return {
    secureCurrentTripId: prior?.secureCurrentTripId ?? "trip-a",
    serverCurrentTrip: prior?.serverCurrentTrip ?? "trip-a",
    contextTrip: prior?.contextTrip ?? {
      tripid: "trip-a",
      tripName: "Old",
      tripCurrency: "EUR",
    },
    contextTravellers: prior?.contextTravellers ?? [
      { uid: "u9", userName: "Oldie" },
    ],
    expensesState: prior?.expensesState ?? [expense("e-old", "stale")],
    expensesCache: prior?.expensesCache ?? [expense("e-old", "stale")],
    updateUserCalls: [],
    setCurrentTripCalls: [],
  };
}

function depsFor(probe: StoreProbe, overrides: Record<string, unknown> = {}) {
  return {
    uid: "u1",
    fetchTrip: async () => tripX(),
    getTravellers: async () => [
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ],
    getAllExpenses: async () => [expense("e-x1", "ramen")],
    updateUser: async (_uid: string, data: { currentTrip: string }) => {
      probe.serverCurrentTrip = data.currentTrip;
      probe.updateUserCalls.push(data);
    },
    secureStoreGetItem: async (key: string) =>
      key === "currentTripId" ? probe.secureCurrentTripId : null,
    secureStoreSetItem: async (key: string, value: string) => {
      if (key === "currentTripId") probe.secureCurrentTripId = value;
    },
    setCurrentTrip: async (tripid: string, trip: TripData) => {
      probe.setCurrentTripCalls.push(tripid);
      probe.contextTrip = { ...trip, tripid };
      if (trip.travellers) {
        probe.contextTravellers = trip.travellers as Traveller[];
      }
    },
    saveTripDataInStorage: async (trip: TripData) => {
      probe.contextTrip = { ...(probe.contextTrip ?? {}), ...trip };
    },
    saveTravellersInStorage: async (travellers: Traveller[]) => {
      probe.contextTravellers = travellers;
    },
    setExpenses: (expenses: ExpenseData[]) => {
      probe.expensesState = expenses;
    },
    setExpensesCache: (expenses: ExpenseData[]) => {
      probe.expensesCache = expenses;
    },
    setFreshlyCreatedTo: async () => {},
    ...overrides,
  };
}

describe("join entry path via activateTrip", () => {
  it("awaits server currentTrip and replaces stale expenses with the joined trip ledger", async () => {
    const probe = emptyProbe();
    const joinedRoster: Traveller[] = [
      { uid: "u1", userName: "Alice" },
      { uid: "u3", userName: "Carol" },
    ];
    const joinedExpenses = [expense("e-join", "welcome dinner")];

    await activateTrip(
      "trip-x",
      depsFor(probe, {
        tripData: tripX(),
        getTravellers: async () => joinedRoster,
        getAllExpenses: async () => joinedExpenses,
      })
    );

    expect(probe.updateUserCalls).toEqual([{ currentTrip: "trip-x" }]);
    expect(probe.secureCurrentTripId).toBe("trip-x");
    expect(probe.serverCurrentTrip).toBe("trip-x");
    expect(probe.contextTrip?.tripid).toBe("trip-x");
    expect(probe.contextTravellers).toEqual(joinedRoster);
    expect(probe.expensesState).toEqual(joinedExpenses);
    expect(probe.expensesState.some((e) => e.id === "e-old")).toBe(false);
  });
});

describe("login entry path via activateTrip", () => {
  it("shows the server Active trip with its expenses and roster, not an emptied ledger", async () => {
    const probe = emptyProbe({
      secureCurrentTripId: null,
      serverCurrentTrip: null,
      expensesState: [],
      expensesCache: [],
    });
    const loginExpenses = [
      expense("e-l1", "taxi"),
      expense("e-l2", "hotel"),
    ];
    const loginRoster: Traveller[] = [{ uid: "u1", userName: "Alice" }];

    await activateTrip(
      "trip-x",
      depsFor(probe, {
        getTravellers: async () => loginRoster,
        getAllExpenses: async () => loginExpenses,
      })
    );

    expect(probe.secureCurrentTripId).toBe("trip-x");
    expect(probe.serverCurrentTrip).toBe("trip-x");
    expect(probe.contextTrip?.tripName).toBe("Japan");
    expect(probe.contextTravellers).toEqual(loginRoster);
    expect(probe.expensesState).toEqual(loginExpenses);
    expect(probe.expensesState).toHaveLength(2);
  });
});

describe("boot entry path via activateTrip", () => {
  it("activates the secure-store Active trip id once without leaving prior-trip expenses", async () => {
    const probe = emptyProbe({
      secureCurrentTripId: "trip-x",
      serverCurrentTrip: "trip-other",
    });

    await activateTrip("trip-x", depsFor(probe));

    expect(probe.setCurrentTripCalls).toEqual(["trip-x"]);
    expect(probe.secureCurrentTripId).toBe("trip-x");
    expect(probe.serverCurrentTrip).toBe("trip-x");
    expect(probe.expensesState.some((e) => e.id === "e-old")).toBe(false);
    expect(probe.expensesState[0]?.id).toBe("e-x1");
  });
});

describe("offline boot via activateTripFromLastKnown", () => {
  it("loads last-known Active trip, roster, and expenses through the seam without server drift", async () => {
    const probe = emptyProbe({
      secureCurrentTripId: "trip-x",
      serverCurrentTrip: "trip-x",
    });
    const lastKnownTrip = tripX();
    const lastKnownRoster: Traveller[] = [
      { uid: "u1", userName: "Alice" },
    ];
    const lastKnownExpenses = [expense("e-cached", "cached ramen")];
    let fetchTripCalls = 0;

    await activateTripFromLastKnown(
      "trip-x",
      {
        tripData: lastKnownTrip,
        roster: lastKnownRoster,
        expenses: lastKnownExpenses,
      },
      depsFor(probe, {
        fetchTrip: async () => {
          fetchTripCalls += 1;
          throw new Error("network unavailable");
        },
        getTravellers: async () => {
          throw new Error("network unavailable");
        },
        getAllExpenses: async () => {
          throw new Error("network unavailable");
        },
        // Intentionally omit updateUser — offline seam must no-op the server mirror.
        updateUser: undefined,
      })
    );

    expect(fetchTripCalls).toBe(0);
    expect(probe.secureCurrentTripId).toBe("trip-x");
    expect(probe.contextTrip?.tripid).toBe("trip-x");
    expect(probe.contextTrip?.tripName).toBe("Japan");
    expect(probe.contextTravellers).toEqual(lastKnownRoster);
    expect(probe.expensesState).toEqual(lastKnownExpenses);
    // Server mirror skipped offline; prior server value unchanged.
    expect(probe.serverCurrentTrip).toBe("trip-x");
    expect(probe.updateUserCalls).toEqual([]);
  });
});
