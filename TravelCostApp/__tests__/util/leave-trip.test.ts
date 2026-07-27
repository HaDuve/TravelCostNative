jest.mock("../../util/http", () => ({
  removeTravelerFromTrip: jest.fn(async () => ({ status: 200 })),
  removeTripFromHistory: jest.fn(async () => undefined),
}));

import type { ExpenseData } from "../../util/expense";
import type { Traveller } from "../../util/traveler";
import type { TripData } from "../../types/trip";
import type { ActivateTripDeps } from "../../util/activate-trip";
import { leaveTrip } from "../../util/leave-trip";
import {
  removeTravelerFromTrip,
  removeTripFromHistory,
} from "../../util/http";

const removeTravelerFromTripMock = removeTravelerFromTrip as jest.MockedFunction<
  typeof removeTravelerFromTrip
>;
const removeTripFromHistoryMock = removeTripFromHistory as jest.MockedFunction<
  typeof removeTripFromHistory
>;

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

function tripB(): TripData {
  return {
    tripid: "trip-b",
    tripName: "Portugal",
    totalBudget: "800",
    dailyBudget: "40",
    tripCurrency: "EUR",
    travellers: [],
    startDate: "2026-02-01",
    endDate: "2026-02-10",
    isDynamicDailyBudget: false,
  };
}

function multiTravellerRoster(): Traveller[] {
  return [
    { uid: "u1", userName: "Alice" },
    { uid: "u2", userName: "Bob" },
  ];
}

/** In-memory Active trip mirrors for asserting promotion consistency. */
function createActivateProbe(initialActiveId: string) {
  let secureCurrentTripId: string | null = initialActiveId;
  let serverCurrentTrip: string | null = initialActiveId;
  let contextTrip: TripData | null = {
    tripid: initialActiveId,
    tripName: "Old active",
    tripCurrency: "EUR",
  };
  let expensesState: ExpenseData[] = [expense("e-old", "from old active")];
  let expensesCache: ExpenseData[] = [...expensesState];
  const promotedExpenses = [expense("e-b1", "pastel de nata")];

  const activate: Omit<ActivateTripDeps, "uid"> = {
    fetchTrip: async (tripid) => {
      if (tripid === "trip-b") return tripB();
      throw new Error(`unexpected trip ${tripid}`);
    },
    getTravellers: async () => multiTravellerRoster(),
    getAllExpenses: async () => promotedExpenses,
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
    setExpensesCache: (expenses) => {
      expensesCache = expenses;
    },
    setFreshlyCreatedTo: async () => {},
  };

  return {
    activate,
    mirrors: () => ({
      secureCurrentTripId,
      serverCurrentTrip,
      contextTripid: contextTrip?.tripid ?? null,
      contextTripName: contextTrip?.tripName ?? null,
      expensesState,
      expensesCache,
    }),
    promotedExpenses,
  };
}

describe("leaveTrip plain leave", () => {
  beforeEach(() => {
    removeTravelerFromTripMock.mockClear();
    removeTripFromHistoryMock.mockClear();
  });

  it("loads the Traveller roster before planning so a non-active leave can run", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const getTravellers = jest.fn(async () => multiTravellerRoster());

    const result = await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers,
      removeFromTripHistoryLocal,
    });

    expect(getTravellers).toHaveBeenCalledWith("trip-b");
    expect(result.performed).toBe(true);
    expect(result.mode).toBe("leave");
    expect(result.nextActiveTripId).toBeNull();
    expect(removeTravelerFromTripMock).toHaveBeenCalledWith("trip-b", "u1");
    expect(removeTripFromHistoryMock).toHaveBeenCalledWith("u1", "trip-b");
    expect(removeFromTripHistoryLocal).toHaveBeenCalledWith("trip-b");
  });

  it("does not write when the planner refuses plain leave", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const getTravellers = jest.fn(async () => [
      { uid: "u1", userName: "Alice" },
    ]);

    const result = await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers,
      removeFromTripHistoryLocal,
    });

    expect(result.performed).toBe(false);
    expect(result.mode).toBe("cascadeDelete");
    expect(removeTravelerFromTripMock).not.toHaveBeenCalled();
    expect(removeTripFromHistoryMock).not.toHaveBeenCalled();
    expect(removeFromTripHistoryLocal).not.toHaveBeenCalled();
  });
});

describe("leaveTrip Active trip promotion", () => {
  beforeEach(() => {
    removeTravelerFromTripMock.mockClear();
    removeTripFromHistoryMock.mockClear();
  });

  it("promotes the first remaining Trip history id via activateTrip when leaving the Active trip", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const probe = createActivateProbe("trip-a");

    const result = await leaveTrip("trip-a", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b", "trip-c"],
      activeTripId: "trip-a",
      getTravellers: async () => multiTravellerRoster(),
      removeFromTripHistoryLocal,
      activate: probe.activate,
    });

    expect(result.performed).toBe(true);
    expect(result.nextActiveTripId).toBe("trip-b");
    expect(result.promotedTripName).toBe("Portugal");

    const mirrors = probe.mirrors();
    expect(mirrors.secureCurrentTripId).toBe("trip-b");
    expect(mirrors.serverCurrentTrip).toBe("trip-b");
    expect(mirrors.contextTripid).toBe("trip-b");
    expect(mirrors.contextTripName).toBe("Portugal");
    expect(mirrors.expensesState).toEqual(probe.promotedExpenses);
    expect(mirrors.expensesCache).toEqual(probe.promotedExpenses);
  });

  it("does not change the Active trip or its expenses when leaving a non-active trip", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const probe = createActivateProbe("trip-a");
    const before = probe.mirrors();

    const result = await leaveTrip("trip-c", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b", "trip-c"],
      activeTripId: "trip-a",
      getTravellers: async () => multiTravellerRoster(),
      removeFromTripHistoryLocal,
      activate: probe.activate,
    });

    expect(result.performed).toBe(true);
    expect(result.nextActiveTripId).toBeNull();
    expect(result.promotedTripName).toBeNull();

    const after = probe.mirrors();
    expect(after.secureCurrentTripId).toBe(before.secureCurrentTripId);
    expect(after.serverCurrentTrip).toBe(before.serverCurrentTrip);
    expect(after.contextTripid).toBe(before.contextTripid);
    expect(after.expensesState).toEqual(before.expensesState);
    expect(after.expensesCache).toEqual(before.expensesCache);
  });
});

describe("leaveTrip Active trip promotion wiring", () => {
  it("TripForm leave path promotes via leaveTrip activate deps (activateTrip seam)", () => {
    const { readFileSync } = require("fs") as typeof import("fs");
    const { join } = require("path") as typeof import("path");
    const src = readFileSync(
      join(__dirname, "../../components/ManageTrip/TripForm.tsx"),
      "utf8"
    );
    expect(src).toMatch(/activate:\s*\{/);
    expect(src).toMatch(/leaveTripNowShowing/);
    expect(src).toMatch(/result\.nextActiveTripId/);
  });
});
