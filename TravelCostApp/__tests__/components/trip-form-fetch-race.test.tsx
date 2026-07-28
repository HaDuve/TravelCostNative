import * as React from "react";

let latestOnConfirmRange:
  | ((output: { startDate: Date; endDate: Date }) => void)
  | null = null;

jest.mock("../../util/http", () => ({
  storeTrip: jest.fn(),
  storeTripHistory: jest.fn(),
  updateUser: jest.fn(),
  fetchTrip: jest.fn(
    () =>
      new Promise(() => {
        /* resolved per test */
      })
  ),
  updateTripHistory: jest.fn(),
  updateTrip: jest.fn(),
  getAllExpenses: jest.fn(async () => []),
  getTravellers: jest.fn(async () => [{ uid: "u1", userName: "Alice" }]),
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
jest.mock("../../components/UI/DatePickerModal", () => {
  return (props: {
    onConfirmRange?: (output: { startDate: Date; endDate: Date }) => void;
  }) => {
    latestOnConfirmRange = props.onConfirmRange ?? null;
    return null;
  };
});
jest.mock("../../util/appState", () => ({
  sleep: jest.fn(async () => {}),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => "t1"),
  secureStoreSetItem: jest.fn(async () => {}),
}));

import { act, fireEvent, waitFor } from "@testing-library/react-native";

import TripForm from "../../components/ManageTrip/TripForm";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { fetchTrip } from "../../util/http";
import { getFormattedDate } from "../../util/date";
import { toShortFormat } from "../../util/date";

const navigation = {
  navigate: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
};

const pickedStart = new Date("2026-01-15T12:00:00.000Z");
const pickedEnd = new Date("2026-01-20T12:00:00.000Z");

describe("TripForm fetch race", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestOnConfirmRange = null;
    (fetchTrip as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          /* resolved per test */
        })
    );
  });

  it("keeps picked trip dates when fetchTrip completes after date selection", async () => {
    let resolveFetch: (trip: object) => void = () => {};
    (fetchTrip as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const screen = renderWithAppProviders(
      <TripForm navigation={navigation} route={{ params: { tripId: "t1" } }} />,
      {
        network: { isConnected: true, strongConnection: true },
        trip: {
          tripid: "t1",
          tripName: "Japan",
          tripCurrency: "EUR",
          dailyBudget: "50",
          totalBudget: "2000",
          startDate: "",
          endDate: "",
          travellers: [{ uid: "u1", userName: "Alice" }],
        },
        expenses: { expenses: [] },
      }
    );

    await waitFor(() => expect(latestOnConfirmRange).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId("trip-form-optional-section")).toBeTruthy()
    );

    await act(async () => {
      latestOnConfirmRange?.({ startDate: pickedStart, endDate: pickedEnd });
    });

    const startLabel = toShortFormat(new Date(getFormattedDate(pickedStart)!));
    const endLabel = toShortFormat(new Date(getFormattedDate(pickedEnd)!));

    await waitFor(() => {
      expect(screen.getByText(startLabel)).toBeTruthy();
      expect(screen.getByText(endLabel)).toBeTruthy();
    });

    await act(async () => {
      resolveFetch({
        tripName: "Japan",
        tripCurrency: "EUR",
        dailyBudget: "50",
        totalBudget: "2000",
        startDate: "",
        endDate: "",
        isDynamicDailyBudget: false,
        isImplicitDefault: false,
        travellers: [{ uid: "u1", userName: "Alice" }],
      });
    });

    await waitFor(() => expect(fetchTrip).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText(startLabel)).toBeTruthy();
      expect(screen.getByText(endLabel)).toBeTruthy();
    });
  });
});
