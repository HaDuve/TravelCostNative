import type { ExpenseData } from "../../util/expense";
import type { Traveller } from "../../util/traveler";
import type { TripData } from "../../types/trip";
import { activateTrip } from "../../util/activate-trip";
import {
  ACTIVE_TRIP_ID_KEY,
  getActiveTripId,
} from "../../util/active-trip-id";
import { readFileSync } from "fs";
import { join } from "path";

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

function src(relFromAppRoot: string): string {
  return readFileSync(join(__dirname, "../..", relFromAppRoot), "utf8");
}

describe("getActiveTripId", () => {
  it("returns the authoritative Active trip id from secure currentTripId", async () => {
    const id = await getActiveTripId({
      secureStoreGetItem: async (key) =>
        key === ACTIVE_TRIP_ID_KEY ? "trip-secure" : null,
    });

    expect(id).toBe("trip-secure");
  });

  it("returns null when secure storage has no Active trip id", async () => {
    await expect(
      getActiveTripId({
        secureStoreGetItem: async () => "",
      })
    ).resolves.toBeNull();

    await expect(
      getActiveTripId({
        secureStoreGetItem: async () => null,
      })
    ).resolves.toBeNull();
  });

  it("after activateTrip switch, accessor and mirrors all agree on the new Active trip", async () => {
    let secureCurrentTripId: string | null = "trip-a";
    let serverCurrentTrip: string | null = "trip-a";
    let contextTripid: string | null = "trip-a";
    const roster: Traveller[] = [{ uid: "u1", userName: "Alice" }];

    const deps = {
      secureStoreGetItem: async (key: string) =>
        key === ACTIVE_TRIP_ID_KEY ? secureCurrentTripId : null,
      secureStoreSetItem: async (key: string, value: string) => {
        if (key === ACTIVE_TRIP_ID_KEY) secureCurrentTripId = value;
      },
    };

    await activateTrip("trip-x", {
      uid: "u1",
      fetchTrip: async () => tripX(),
      getTravellers: async () => roster,
      getAllExpenses: async () => [expense("e-x1", "ramen")],
      updateUser: async (_uid, data) => {
        serverCurrentTrip = data.currentTrip ?? serverCurrentTrip;
      },
      ...deps,
      setCurrentTrip: async (tripid) => {
        contextTripid = tripid;
      },
      saveTripDataInStorage: async () => {},
      saveTravellersInStorage: async () => {},
      setExpenses: () => {},
      setExpensesCache: () => {},
      setFreshlyCreatedTo: async () => {},
    });

    await expect(getActiveTripId(deps)).resolves.toBe("trip-x");
    expect(serverCurrentTrip).toBe("trip-x");
    expect(contextTripid).toBe("trip-x");
  });
});

describe("Active trip id reader wiring (#327)", () => {
  it("offline queue, HTTP helpers, App boot, TripContext, and Login resolve via getActiveTripId", () => {
    expect(src("util/offline-queue.ts")).toMatch(/getActiveTripId\(/);
    expect(src("util/offline-queue.ts")).not.toMatch(
      /secureStoreGetItem\(["']currentTripId["']\)/
    );

    expect(src("util/http.tsx")).toMatch(/getActiveTripId\(/);
    expect(src("util/http.tsx")).not.toMatch(
      /secureStoreGetItem\(["']currentTripId["']\)/
    );

    expect(src("App.tsx")).toMatch(/getActiveTripId\(/);
    expect(src("App.tsx")).not.toMatch(
      /secureStoreGetItem\(["']currentTripId["']\)/
    );

    expect(src("store/trip-context.tsx")).toMatch(/getActiveTripId\(/);
    expect(src("store/trip-context.tsx")).not.toMatch(
      /fetched_tripid \?\? stored_tripid/
    );

    expect(src("screens/LoginScreen.tsx")).toMatch(
      /getActiveTripId\(\)\)\s*\?\?\s*userData\.currentTrip/
    );
  });
});
