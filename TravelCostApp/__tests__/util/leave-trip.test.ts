let mockLastToastOnHide: (() => void) | undefined;

jest.mock("react-native-toast-message", () => ({
  show: jest.fn((args) => {
    mockLastToastOnHide = args.onHide;
  }),
  hide: jest.fn(() => {
    mockLastToastOnHide?.();
  }),
}));

jest.mock("../../util/http", () => ({
  removeTravelerFromTrip: jest.fn(async () => ({ status: 200 })),
  removeTripFromHistory: jest.fn(async () => undefined),
  putTravelerInTrip: jest.fn(async () => ({})),
  storeTripHistory: jest.fn(async () => undefined),
  deleteTrip: jest.fn(async () => ({ status: 200 })),
}));

import Toast from "react-native-toast-message";
import { i18n } from "../../i18n/i18n";
import type { ExpenseData } from "../../util/expense";
import type { Traveller } from "../../util/traveler";
import type { TripData } from "../../types/trip";
import type { ActivateTripDeps } from "../../util/activate-trip";
import {
  UNDO_LEAVE_WINDOW_MS,
  clearPendingUndoLeave,
  leaveTrip,
  undoLeaveTrip,
} from "../../util/leave-trip";
import {
  deleteTrip,
  putTravelerInTrip,
  removeTravelerFromTrip,
  removeTripFromHistory,
  storeTripHistory,
} from "../../util/http";

const removeTravelerFromTripMock = removeTravelerFromTrip as jest.MockedFunction<
  typeof removeTravelerFromTrip
>;
const removeTripFromHistoryMock = removeTripFromHistory as jest.MockedFunction<
  typeof removeTripFromHistory
>;
const putTravelerInTripMock = putTravelerInTrip as jest.MockedFunction<
  typeof putTravelerInTrip
>;
const storeTripHistoryMock = storeTripHistory as jest.MockedFunction<
  typeof storeTripHistory
>;
const deleteTripMock = deleteTrip as jest.MockedFunction<typeof deleteTrip>;

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
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLastToastOnHide = undefined;
    clearPendingUndoLeave();
  });

  afterEach(() => {
    jest.useRealTimers();
    clearPendingUndoLeave();
  });

  it("loads the Traveller roster before planning so a non-active leave can run", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const restoreTripHistoryLocal = jest.fn();
    const getTravellers = jest.fn(async () => multiTravellerRoster());

    const result = await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers,
      removeFromTripHistoryLocal,
      restoreTripHistoryLocal,
    });

    expect(getTravellers).toHaveBeenCalledWith("trip-b");
    expect(result.performed).toBe(true);
    expect(result.mode).toBe("leave");
    expect(result.nextActiveTripId).toBeNull();
    expect(removeTravelerFromTripMock).toHaveBeenCalledWith("trip-b", "u1");
    expect(removeTripFromHistoryMock).toHaveBeenCalledWith("u1", "trip-b");
    expect(removeFromTripHistoryLocal).toHaveBeenCalledWith("trip-b");
  });

  it("does not write when the last-trip guard forbids leaving", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const restoreTripHistoryLocal = jest.fn();
    const getTravellers = jest.fn(async () => multiTravellerRoster());

    const result = await leaveTrip("trip-a", {
      uid: "u1",
      tripHistory: ["trip-a"],
      activeTripId: "trip-a",
      getTravellers,
      removeFromTripHistoryLocal,
      restoreTripHistoryLocal,
    });

    expect(result.performed).toBe(false);
    expect(result.allowed).toBe(false);
    expect(removeTravelerFromTripMock).not.toHaveBeenCalled();
    expect(deleteTripMock).not.toHaveBeenCalled();
    expect(removeTripFromHistoryMock).not.toHaveBeenCalled();
    expect(removeFromTripHistoryLocal).not.toHaveBeenCalled();
  });

  it("shows a deletedExpense Undo toast after a plain leave", async () => {
    await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers: async () => multiTravellerRoster(),
      removeFromTripHistoryLocal: jest.fn(),
      restoreTripHistoryLocal: jest.fn(),
    });

    const undoToast = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense"
    );
    expect(undoToast).toBeDefined();
    expect(undoToast![0].text1).toBe(i18n.t("toastLeftTrip1"));
    expect(undoToast![0].text2).toBe(i18n.t("toastLeftTrip2"));
    expect(undoToast![0].visibilityTime).toBe(UNDO_LEAVE_WINDOW_MS);
    expect(undoToast![0].props?.onUndo).toEqual(expect.any(Function));
  });

  it("Undo toast text1 names the promoted Active trip after leaving Active trip", async () => {
    const probe = createActivateProbe("trip-a");

    await leaveTrip("trip-a", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers: async () => multiTravellerRoster(),
      removeFromTripHistoryLocal: jest.fn(),
      restoreTripHistoryLocal: jest.fn(),
      activate: probe.activate,
    });

    const undoToast = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense"
    );
    expect(undoToast![0].text1).toBe(
      i18n.t("leaveTripNowShowing", { name: "Portugal" })
    );
  });

});

describe("leaveTrip cascade-delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLastToastOnHide = undefined;
    clearPendingUndoLeave();
  });

  afterEach(() => {
    jest.useRealTimers();
    clearPendingUndoLeave();
  });

  it("cascade-deletes the trip via deleteTrip when the leaver is the last Traveller", async () => {
    const removeFromTripHistoryLocal = jest.fn();

    const result = await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers: async () => [{ uid: "u1", userName: "Alice" }],
      removeFromTripHistoryLocal,
      restoreTripHistoryLocal: jest.fn(),
    });

    expect(result.performed).toBe(true);
    expect(result.mode).toBe("cascadeDelete");
    expect(result.warnings).toContain("permanentDelete");
    expect(deleteTripMock).toHaveBeenCalledWith("trip-b");
    expect(removeTripFromHistoryMock).toHaveBeenCalledWith("u1", "trip-b");
    expect(removeFromTripHistoryLocal).toHaveBeenCalledWith("trip-b");
    expect(removeTravelerFromTripMock).not.toHaveBeenCalled();
  });

  it("does not show an Undo toast for the cascade-delete path", async () => {
    await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers: async () => [{ uid: "u1", userName: "Alice" }],
      removeFromTripHistoryLocal: jest.fn(),
      restoreTripHistoryLocal: jest.fn(),
    });

    const undoToast = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense"
    );
    expect(undoToast).toBeUndefined();
  });

  it("promotes Active trip before cascade-delete when leaving the Active trip", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const probe = createActivateProbe("trip-a");

    const result = await leaveTrip("trip-a", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers: async () => [{ uid: "u1", userName: "Alice" }],
      removeFromTripHistoryLocal,
      restoreTripHistoryLocal: jest.fn(),
      activate: probe.activate,
    });

    expect(result.performed).toBe(true);
    expect(result.mode).toBe("cascadeDelete");
    expect(result.nextActiveTripId).toBe("trip-b");
    expect(result.promotedTripName).toBe("Portugal");
    expect(deleteTripMock).toHaveBeenCalledWith("trip-a");
    expect(probe.mirrors().secureCurrentTripId).toBe("trip-b");
  });
});

describe("leaveTrip Active trip promotion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLastToastOnHide = undefined;
    clearPendingUndoLeave();
  });

  afterEach(() => {
    jest.useRealTimers();
    clearPendingUndoLeave();
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
      restoreTripHistoryLocal: jest.fn(),
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
      restoreTripHistoryLocal: jest.fn(),
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

  it("promotes before leave writes so a failed activate does not orphan Active trip", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const probe = createActivateProbe("trip-a");
    const previousTrip: TripData = {
      tripid: "trip-a",
      tripName: "Old active",
      tripCurrency: "EUR",
    };
    const previousExpenses = [expense("e-old", "from old active")];
    probe.activate.previousTripSnapshot = previousTrip;
    probe.activate.previousExpensesSnapshot = previousExpenses;
    probe.activate.setExpensesCache = () => {
      throw new Error("cache write failed");
    };

    await expect(
      leaveTrip("trip-a", {
        uid: "u1",
        tripHistory: ["trip-a", "trip-b"],
        activeTripId: "trip-a",
        getTravellers: async () => multiTravellerRoster(),
        removeFromTripHistoryLocal,
        restoreTripHistoryLocal: jest.fn(),
        activate: probe.activate,
      })
    ).rejects.toThrow("cache write failed");

    expect(removeTravelerFromTripMock).not.toHaveBeenCalled();
    expect(removeTripFromHistoryMock).not.toHaveBeenCalled();
    expect(removeFromTripHistoryLocal).not.toHaveBeenCalled();

    const mirrors = probe.mirrors();
    expect(mirrors.secureCurrentTripId).toBe("trip-a");
    expect(mirrors.serverCurrentTrip).toBe("trip-a");
    expect(mirrors.contextTripid).toBe("trip-a");
  });
});

describe("leaveTrip Active trip promotion wiring", () => {
  it("TripForm leave path wires activate + Trip history restore for Undo", () => {
    const { readFileSync } = require("fs") as typeof import("fs");
    const { join } = require("path") as typeof import("path");
    const src = readFileSync(
      join(__dirname, "../../components/ManageTrip/TripForm.tsx"),
      "utf8"
    );
    expect(src).toMatch(/activate:\s*\{/);
    expect(src).toMatch(/restoreTripHistoryLocal/);
    expect(src).toMatch(/removeFromTripHistoryLocal/);
  });

  it("leaveTrip owns Undo toast copy for plain leave and promotion", () => {
    const { readFileSync } = require("fs") as typeof import("fs");
    const { join } = require("path") as typeof import("path");
    const src = readFileSync(
      join(__dirname, "../../util/leave-trip.ts"),
      "utf8"
    );
    expect(src).toMatch(/toastLeftTrip1/);
    expect(src).toMatch(/leaveTripNowShowing/);
    expect(src).toMatch(/type:\s*"deletedExpense"/);
  });
});

describe("undoLeaveTrip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLastToastOnHide = undefined;
    clearPendingUndoLeave();
  });

  afterEach(() => {
    jest.useRealTimers();
    clearPendingUndoLeave();
  });

  it("restores the Traveller roster entry and Trip history when Undo is pressed in time", async () => {
    const restoreTripHistoryLocal = jest.fn();
    const previousHistory = ["trip-a", "trip-b"];

    await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: previousHistory,
      activeTripId: "trip-a",
      getTravellers: async () => multiTravellerRoster(),
      removeFromTripHistoryLocal: jest.fn(),
      restoreTripHistoryLocal,
    });

    const { onUndo } = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense"
    )![0].props;

    await onUndo();

    expect(putTravelerInTripMock).toHaveBeenCalledWith("trip-b", {
      uid: "u1",
      userName: "Alice",
    });
    expect(storeTripHistoryMock).toHaveBeenCalledWith("u1", previousHistory);
    expect(restoreTripHistoryLocal).toHaveBeenCalledWith(previousHistory);
  });

  it("restores the previously Active trip when leave had promoted another", async () => {
    const probe = createActivateProbe("trip-a");
    // After leave, Active trip is trip-b; Undo must re-activate trip-a.
    probe.activate.fetchTrip = async (tripid) => {
      if (tripid === "trip-b") return tripB();
      if (tripid === "trip-a") {
        return {
          tripid: "trip-a",
          tripName: "Old active",
          tripCurrency: "EUR",
        };
      }
      throw new Error(`unexpected trip ${tripid}`);
    };

    await leaveTrip("trip-a", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b", "trip-c"],
      activeTripId: "trip-a",
      getTravellers: async () => multiTravellerRoster(),
      removeFromTripHistoryLocal: jest.fn(),
      restoreTripHistoryLocal: jest.fn(),
      activate: probe.activate,
    });

    expect(probe.mirrors().secureCurrentTripId).toBe("trip-b");

    const { onUndo } = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense"
    )![0].props;

    await onUndo();

    const mirrors = probe.mirrors();
    expect(mirrors.secureCurrentTripId).toBe("trip-a");
    expect(mirrors.serverCurrentTrip).toBe("trip-a");
    expect(mirrors.contextTripid).toBe("trip-a");
  });

  it("does not restore Trip history when roster restore fails", async () => {
    const restoreTripHistoryLocal = jest.fn();
    putTravelerInTripMock.mockResolvedValueOnce(null);

    await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers: async () => multiTravellerRoster(),
      removeFromTripHistoryLocal: jest.fn(),
      restoreTripHistoryLocal,
    });

    const { onUndo } = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense"
    )![0].props;

    await onUndo();

    expect(putTravelerInTripMock).toHaveBeenCalled();
    expect(storeTripHistoryMock).not.toHaveBeenCalled();
    expect(restoreTripHistoryLocal).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        text2: i18n.t("error2"),
      })
    );
  });

  it("shows expired copy when Undo is pressed after the window", async () => {
    await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers: async () => multiTravellerRoster(),
      removeFromTripHistoryLocal: jest.fn(),
      restoreTripHistoryLocal: jest.fn(),
    });

    const { actionId } = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense"
    )![0].props;

    jest.advanceTimersByTime(UNDO_LEAVE_WINDOW_MS + 1);

    await undoLeaveTrip({ actionId });

    expect(putTravelerInTripMock).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        text2: i18n.t("toastUndoLeaveExpired"),
      })
    );
  });
});
