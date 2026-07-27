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
import { getTravellers } from "../../util/http";
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

  it("has permanent-delete warning copy in EN/DE/FR/RU", () => {
    expect(en.leaveTripPermanentDeleteSure).toMatch(/permanent/i);
    expect(de.leaveTripPermanentDeleteSure.length).toBeGreaterThan(10);
    expect(fr.leaveTripPermanentDeleteSure.length).toBeGreaterThan(10);
    expect(ru.leaveTripPermanentDeleteSure.length).toBeGreaterThan(10);
  });
});
