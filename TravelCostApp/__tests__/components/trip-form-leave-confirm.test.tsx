import * as React from "react";
import { Alert } from "react-native";

jest.mock("../../util/http", () => ({
  storeTrip: jest.fn(),
  storeTripHistory: jest.fn(),
  updateUser: jest.fn(),
  fetchTrip: jest.fn(async () => ({
    tripName: "Japan",
    tripCurrency: "EUR",
    dailyBudget: "50",
    totalBudget: "2000",
    startDate: "2026-01-01",
    endDate: "2026-01-10",
    isDynamicDailyBudget: false,
    travellers: [],
  })),
  updateTripHistory: jest.fn(),
  updateTrip: jest.fn(),
  getAllExpenses: jest.fn(async () => []),
  getTravellers: jest.fn(),
  putTravelerInTrip: jest.fn(),
  deleteTrip: jest.fn(),
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 0,
}));

jest.mock("../../components/Currency/CurrencyPicker", () => () => null);
jest.mock("../../components/UI/DatePickerModal", () => () => null);
jest.mock("../../components/UI/DatePickerContainer", () => () => null);

jest.mock("../../util/appState", () => ({
  sleep: jest.fn(async () => {}),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => "u1"),
  secureStoreSetItem: jest.fn(async () => {}),
}));

import { fireEvent, waitFor } from "@testing-library/react-native";

import TripForm from "../../components/ManageTrip/TripForm";
import { i18n } from "../../i18n/i18n";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { makeExpense } from "../fixtures/expense";
import { getAllExpenses, getTravellers } from "../../util/http";
import {
  de,
  en,
  fr,
  ru,
} from "../../i18n/supportedLanguages";

const navigation = {
  navigate: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
};

const getTravellersMock = getTravellers as jest.MockedFunction<
  typeof getTravellers
>;
const getAllExpensesMock = getAllExpenses as jest.MockedFunction<
  typeof getAllExpenses
>;

describe("TripForm Leave trip confirm dialog", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  function renderEditForm() {
    return renderWithAppProviders(
      <TripForm
        navigation={navigation}
        route={{ params: { tripId: "trip-b" } }}
      />,
      {
        network: { isConnected: true, strongConnection: true },
        auth: { uid: "u1" },
        trip: {
          tripid: "trip-a",
          tripName: "Active",
          leaveTrip: jest.fn(async () => ({
            allowed: true,
            mode: "leave",
            nextActiveTripId: null,
            warnings: [],
            performed: true,
            promotedTripName: null,
          })),
        },
        user: {
          tripHistory: ["trip-a", "trip-b"],
          removeTripFromHistory: jest.fn(),
          restoreTripHistory: jest.fn(),
        },
        expenses: { expenses: [] },
      }
    );
  }

  it("shows the escalated permanent-delete warning when the leaver is the last Traveller", async () => {
    getTravellersMock.mockResolvedValue([{ uid: "u1", userName: "Alice" }]);

    const screen = renderEditForm();
    fireEvent.press(await screen.findByText(i18n.t("leaveTrip")));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        i18n.t("leaveTripPermanentDeleteSure"),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  it("shows the plain leave warning when other Travellers remain", async () => {
    getTravellersMock.mockResolvedValue([
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ]);

    const screen = renderEditForm();
    fireEvent.press(await screen.findByText(i18n.t("leaveTrip")));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        i18n.t("leaveTripSure"),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  it("surfaces an error alert when roster fetch fails before confirm", async () => {
    getTravellersMock.mockRejectedValue(new Error("network"));

    const screen = renderEditForm();
    fireEvent.press(await screen.findByText(i18n.t("leaveTrip")));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("error"),
        i18n.t("error2")
      );
    });
  });

  it("has permanent-delete warning copy in EN/DE/FR/RU", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.leaveTripPermanentDeleteSure.length).toBeGreaterThan(10);
      expect(locale.leaveTripPermanentDeleteSure).not.toBe(
        locale.leaveTripSure
      );
    }
    expect(en.leaveTripPermanentDeleteSure).toMatch(/permanent/i);
  });

  it("shows an open-Balance warning when the leaver has unsettled Balances", async () => {
    getTravellersMock.mockResolvedValue([
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ]);
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

    const screen = renderEditForm();
    fireEvent.press(await screen.findByText(i18n.t("leaveTrip")));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        expect.stringContaining(i18n.t("leaveTripOpenBalancesWarning")),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  it("still offers Leave after the open-Balance warning (warn, do not block)", async () => {
    getTravellersMock.mockResolvedValue([
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ]);
    getAllExpensesMock.mockResolvedValue([
      makeExpense({
        whoPaid: "Bob",
        amount: 40,
        calcAmount: 40,
        currency: "EUR",
        splitList: [
          { userName: "Alice", amount: 20 },
          { userName: "Bob", amount: 20 },
        ],
      }),
    ]);

    const screen = renderEditForm();
    fireEvent.press(await screen.findByText(i18n.t("leaveTrip")));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        expect.stringContaining(i18n.t("leaveTripOpenBalancesWarning")),
        expect.any(Array),
        expect.any(Object)
      );
    });

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      style?: string;
      onPress?: () => void;
    }>;
    expect(buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: i18n.t("leaveTrip"),
          style: "destructive",
        }),
      ])
    );
    expect(typeof buttons.find((b) => b.style === "destructive")?.onPress).toBe(
      "function"
    );
  });

  it("does not show the open-Balance warning when Balances are zero", async () => {
    getTravellersMock.mockResolvedValue([
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ]);
    getAllExpensesMock.mockResolvedValue([]);

    const screen = renderEditForm();
    fireEvent.press(await screen.findByText(i18n.t("leaveTrip")));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        i18n.t("leaveTripSure"),
        expect.any(Array),
        expect.any(Object)
      );
    });
    expect(alertSpy.mock.calls[0][1]).not.toContain(
      i18n.t("leaveTripOpenBalancesWarning")
    );
  });

  it("does not warn the leaver about open Balances that only involve other Travellers", async () => {
    getTravellersMock.mockResolvedValue([
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
      { uid: "u3", userName: "Charlie" },
    ]);
    getAllExpensesMock.mockResolvedValue([
      makeExpense({
        whoPaid: "Bob",
        amount: 80,
        calcAmount: 80,
        currency: "EUR",
        splitList: [
          { userName: "Bob", amount: 40 },
          { userName: "Charlie", amount: 40 },
        ],
      }),
    ]);

    const screen = renderEditForm();
    fireEvent.press(await screen.findByText(i18n.t("leaveTrip")));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        i18n.t("leaveTrip"),
        i18n.t("leaveTripSure"),
        expect.any(Array),
        expect.any(Object)
      );
    });
    expect(alertSpy.mock.calls[0][1]).not.toContain(
      i18n.t("leaveTripOpenBalancesWarning")
    );
  });

  it("has open-Balance warning copy in EN/DE/FR/RU", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.leaveTripOpenBalancesWarning.length).toBeGreaterThan(10);
      expect(locale.leaveTripOpenBalancesWarning).not.toBe(locale.leaveTripSure);
      expect(locale.leaveTripOpenBalancesWarning).not.toBe(
        locale.leaveTripPermanentDeleteSure
      );
    }
    expect(en.leaveTripOpenBalancesWarning.toLowerCase()).toMatch(/balance/);
  });
});
