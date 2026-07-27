import * as React from "react";

jest.mock("../../util/http", () => ({
  storeTrip: jest.fn(),
  storeTripHistory: jest.fn(),
  updateUser: jest.fn(),
  fetchTrip: jest.fn(async () => ({
    tripName: "",
    tripCurrency: "EUR",
    dailyBudget: "0",
    totalBudget: "0",
    isDynamicDailyBudget: false,
    isImplicitDefault: true,
    travellers: [],
  })),
  updateTripHistory: jest.fn(),
  updateTrip: jest.fn(),
  getAllExpenses: jest.fn(async () => []),
  putTravelerInTrip: jest.fn(),
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
  secureStoreSetItem: jest.fn(async () => {}),
}));

import { fireEvent, waitFor } from "@testing-library/react-native";

import TripForm from "../../components/ManageTrip/TripForm";
import { i18n } from "../../i18n/i18n";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { updateTrip } from "../../util/http";

const navigation = {
  navigate: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
};

describe("TripForm budget form modes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (updateTrip as jest.Mock).mockResolvedValue({});
  });
  it("shows Name your budget for promote mode with optional details collapsed", () => {
    const screen = renderWithAppProviders(
      <TripForm
        navigation={navigation}
        route={{ params: { tripId: "t-implicit", mode: "promote" } }}
      />,
      {
        network: { isConnected: true, strongConnection: true },
        trip: {
          tripid: "t-implicit",
          tripName: "",
          tripCurrency: "EUR",
          dailyBudget: "0",
          totalBudget: "0",
          isImplicitDefault: true,
          travellers: ["Alice"],
        },
        expenses: { expenses: [] },
      }
    );

    expect(screen.getByTestId("trip-form-title").props.children).toBe(
      i18n.t("tripFormTitlePromote")
    );
    expect(screen.queryByTestId("trip-form-optional-section")).toBeNull();
  });

  it("shows Add another budget subtitle and collapses optional details", () => {
    const screen = renderWithAppProviders(
      <TripForm navigation={navigation} route={{ params: {} }} />,
      {
        network: { isConnected: true, strongConnection: true },
        expenses: { expenses: [] },
      }
    );

    expect(screen.getByTestId("trip-form-title").props.children).toBe(
      i18n.t("tripFormTitleAddAnother")
    );
    expect(screen.getByTestId("trip-form-subtitle").props.children).toBe(
      i18n.t("tripFormSubtitleAddAnother")
    );
    expect(screen.queryByTestId("trip-form-optional-section")).toBeNull();

    fireEvent.press(screen.getByTestId("trip-form-optional-toggle"));
    expect(screen.getByTestId("trip-form-optional-section")).toBeTruthy();
  });

  it("auto-expands optional details when editing a trip with budgets set", async () => {
    const { fetchTrip } = require("../../util/http");
    fetchTrip.mockResolvedValueOnce({
      tripName: "Japan",
      tripCurrency: "EUR",
      dailyBudget: "50",
      totalBudget: "2000",
      startDate: "2026-01-01",
      endDate: "2026-01-10",
      isDynamicDailyBudget: false,
      travellers: ["Alice"],
    });

    const screen = renderWithAppProviders(
      <TripForm
        navigation={navigation}
        route={{ params: { tripId: "t-japan" } }}
      />,
      {
        network: { isConnected: true, strongConnection: true },
        trip: {
          tripid: "other",
          tripName: "Other",
          dailyBudget: "10",
          totalBudget: "100",
        },
        expenses: { expenses: [] },
      }
    );

    expect(
      await screen.findByTestId("trip-form-optional-section")
    ).toBeTruthy();
    expect(screen.getByTestId("trip-form-title").props.children).toBe(
      i18n.t("tripFormTitleEdit")
    );
  });

  it("naming an implicit default Active trip without mode clears isImplicitDefault via updateTrip", async () => {
    const screen = renderWithAppProviders(
      <TripForm
        navigation={navigation}
        route={{ params: { tripId: "t-implicit" } }}
      />,
      {
        network: { isConnected: true, strongConnection: true },
        trip: {
          tripid: "t-implicit",
          tripName: "",
          tripCurrency: "EUR",
          dailyBudget: "0",
          totalBudget: "0",
          isImplicitDefault: true,
          travellers: ["Alice"],
          saveTripDataInStorage: jest.fn(async () => {}),
          setCurrentTrip: jest.fn(async () => {}),
          fetchAndSetTravellers: jest.fn(async () => true),
          setdailyBudget: jest.fn(),
        },
        user: {
          setFreshlyCreatedTo: jest.fn(async () => {}),
        },
        expenses: {
          expenses: [],
          mergeExpenses: jest.fn(),
        },
        auth: { uid: "u1" },
      }
    );

    expect(await screen.findByTestId("trip-form-title")).toBeTruthy();
    expect(screen.getByTestId("trip-form-title").props.children).toBe(
      i18n.t("tripFormTitlePromote")
    );

    const nameInput = screen.getByDisplayValue("");
    fireEvent.changeText(nameInput, "Home budget");
    fireEvent.press(screen.getByText(i18n.t("saveChanges")));

    await waitFor(() => {
      expect(updateTrip).toHaveBeenCalledWith(
        "t-implicit",
        expect.objectContaining({
          tripName: "Home budget",
          isImplicitDefault: false,
        })
      );
    });
  });
});
