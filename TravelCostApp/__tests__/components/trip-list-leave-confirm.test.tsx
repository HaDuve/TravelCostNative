import * as React from "react";
import { Alert, Platform } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { waitFor } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../util/http", () => ({
  fetchTripName: jest.fn(async () => "Japan 2026"),
  getTravellers: jest.fn(async () => [
    { uid: "u1", userName: "Alice" },
    { uid: "u2", userName: "Bob" },
  ]),
  getTripData: jest.fn(async () => ({
    dailyBudget: "100",
    totalBudget: "3000",
    tripCurrency: "EUR",
  })),
  getAllExpenses: jest.fn(async () => []),
  fetchTrip: jest.fn(async () => ({
    tripCurrency: "EUR",
  })),
  updateUser: jest.fn(),
}));

jest.mock("../../store/mmkv", () => {
  const actual = jest.requireActual("../../store/mmkv-keys");
  return {
    getMMKVObject: jest.fn(() => null),
    setMMKVObject: jest.fn(),
    MMKV_KEYS: actual.MMKV_KEYS,
    MMKV_KEY_PATTERNS: actual.MMKV_KEY_PATTERNS,
  };
});

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => "u1"),
  secureStoreSetItem: jest.fn(async () => {}),
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

import TripList from "../../components/ProfileOutput/TripList";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";
import { makeExpense } from "../fixtures/expense";
import { getAllExpenses, getTravellers } from "../../util/http";

const getTravellersMock = getTravellers as jest.MockedFunction<
  typeof getTravellers
>;
const getAllExpensesMock = getAllExpenses as jest.MockedFunction<
  typeof getAllExpenses
>;

function pressSwipeLeave(screen: ReturnType<typeof renderWithAppProviders>) {
  const rows = screen.UNSAFE_getAllByType(Swipeable);
  expect(rows.length).toBeGreaterThan(0);
  const row = rows[0];
  const actionEl =
    Platform.OS === "android"
      ? row.props.renderLeftActions?.()
      : row.props.renderRightActions?.();
  expect(actionEl).toBeTruthy();
  const onPress = actionEl.props.onPress as () => void;
  onPress();
}

describe("TripList swipe-to-leave", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    getTravellersMock.mockResolvedValue([
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ]);
    getAllExpensesMock.mockResolvedValue([]);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  function renderList(overrides: Parameters<typeof renderWithAppProviders>[1] = {}) {
    return renderWithAppProviders(<TripList trips={["t1", "t2"]} />, {
      network: { isConnected: true, strongConnection: true },
      auth: { uid: "u1" },
      trip: {
        tripid: "t1",
        tripCurrency: "EUR",
        leaveTrip: jest.fn(async () => ({
          allowed: true,
          mode: "leave",
          nextActiveTripId: null,
          warnings: [],
          performed: true,
          promotedTripName: null,
        })),
        getcurrentTrip: jest.fn(() => ({})),
        setCurrentTrip: jest.fn(),
        saveTripDataInStorage: jest.fn(),
        saveTravellersInStorage: jest.fn(),
      },
      user: {
        userName: "Alice",
        tripHistory: ["t1", "t2"],
        removeTripFromHistory: jest.fn(),
        restoreTripHistory: jest.fn(),
        setFreshlyCreatedTo: jest.fn(),
      },
      expenses: { expenses: [], setExpenses: jest.fn() },
      ...overrides,
    });
  }

  it("exposes a swipe-to-leave action on each trip row when Trip history has more than one trip", async () => {
    const screen = renderList();
    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });
    const rows = screen.UNSAFE_getAllByType(Swipeable);
    expect(rows.length).toBe(2);
    const action =
      Platform.OS === "android"
        ? rows[0].props.renderLeftActions?.()
        : rows[0].props.renderRightActions?.();
    expect(action?.props?.onPress).toEqual(expect.any(Function));
  });

  it("does not expose swipe-to-leave when the User has only one trip", async () => {
    const screen = renderWithAppProviders(<TripList trips={["t1"]} />, {
      network: { isConnected: true, strongConnection: true },
      trip: { tripid: "t1" },
      user: { tripHistory: ["t1"] },
      expenses: { expenses: [] },
    });
    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });
    expect(screen.UNSAFE_queryAllByType(Swipeable)).toHaveLength(0);
  });

  it("shows the plain leave confirm when other Travellers remain", async () => {
    const screen = renderList();
    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });
    pressSwipeLeave(screen);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        i18n.t("leaveTripSure"),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  it("shows the escalated permanent-delete warning when the leaver is the last Traveller", async () => {
    getTravellersMock.mockResolvedValue([{ uid: "u1", userName: "Alice" }]);
    const screen = renderList();
    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });
    pressSwipeLeave(screen);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        i18n.t("leaveTripPermanentDeleteSure"),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  it("shows an open-Balance warning when the leaver has unsettled Balances", async () => {
    getAllExpensesMock.mockResolvedValue([
      makeExpense({
        whoPaid: "Alice",
        amount: 100,
        calcAmount: 100,
        currency: "EUR",
        splitList: [
          { userName: "Alice", amount: 50 },
          { userName: "Bob", amount: 50 },
        ],
      }),
    ]);
    const screen = renderList({
      trip: {
        tripid: "t1",
        tripCurrency: "EUR",
        leaveTrip: jest.fn(async () => ({
          allowed: true,
          mode: "leave",
          nextActiveTripId: null,
          warnings: [],
          performed: true,
          promotedTripName: null,
        })),
        getcurrentTrip: jest.fn(() => ({})),
        setCurrentTrip: jest.fn(),
        saveTripDataInStorage: jest.fn(),
        saveTravellersInStorage: jest.fn(),
      },
      expenses: {
        expenses: [
          makeExpense({
            whoPaid: "Alice",
            amount: 100,
            calcAmount: 100,
            currency: "EUR",
            splitList: [
              { userName: "Alice", amount: 50 },
              { userName: "Bob", amount: 50 },
            ],
          }),
        ],
        setExpenses: jest.fn(),
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });
    pressSwipeLeave(screen);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        expect.stringContaining(i18n.t("leaveTripOpenBalancesWarning")),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  it("shows connect-required when offline", async () => {
    const screen = renderList({
      network: { isConnected: false, strongConnection: false },
    });
    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });
    pressSwipeLeave(screen);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("noConnection"),
        i18n.t("leaveTripConnectRequired")
      );
    });
  });

  it("shows connect-required when the connection is weak (matches TripForm leave gating)", async () => {
    const screen = renderList({
      network: { isConnected: true, strongConnection: false },
    });
    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });
    pressSwipeLeave(screen);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("noConnection"),
        i18n.t("leaveTripConnectRequired")
      );
    });
  });

  it("calls leaveTrip when the User confirms the swipe leave dialog", async () => {
    const leaveTrip = jest.fn(async () => ({
      allowed: true,
      mode: "leave",
      nextActiveTripId: null,
      warnings: [],
      performed: true,
      promotedTripName: null,
    }));
    alertSpy.mockImplementation((_title, _msg, buttons) => {
      const leaveBtn = (buttons as Array<{ style?: string; onPress?: () => void }>).find(
        (b) => b.style === "destructive"
      );
      leaveBtn?.onPress?.();
    });

    const screen = renderList({
      trip: {
        tripid: "t1",
        tripCurrency: "EUR",
        leaveTrip,
        getcurrentTrip: jest.fn(() => ({})),
        setCurrentTrip: jest.fn(),
        saveTripDataInStorage: jest.fn(),
        saveTravellersInStorage: jest.fn(),
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });
    pressSwipeLeave(screen);

    await waitFor(() => {
      expect(leaveTrip).toHaveBeenCalledWith(
        "t1",
        expect.objectContaining({
          uid: "u1",
          tripHistory: ["t1", "t2"],
        })
      );
    });
  });
});
