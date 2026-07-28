import * as React from "react";
import { Pressable, StyleSheet } from "react-native";
import { waitFor } from "@testing-library/react-native";

import TripHistoryItem from "../../components/ProfileOutput/TripHistoryItem";
import { GlobalStyles } from "../../constants/styles";
import { renderWithAppProviders } from "../fixtures/app-providers";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../util/http", () => ({
  fetchTripName: jest.fn(async () => "Japan 2026"),
  getTravellers: jest.fn(async () => [{ uid: "u1", userName: "Alice" }]),
  getTripData: jest.fn(async () => ({
    dailyBudget: "100",
    totalBudget: "3000",
    tripCurrency: "EUR",
  })),
}));

jest.mock("../../util/trip", () => ({
  getTripData: jest.fn(),
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

const { getTripData } = jest.requireMock("../../util/trip") as {
  getTripData: jest.Mock;
};
const http = jest.requireMock("../../util/http") as {
  fetchTripName: jest.Mock;
  getTravellers: jest.Mock;
};

function getPressedPressableStyle(
  screen: ReturnType<typeof renderWithAppProviders>
) {
  screen.getByTestId(/^trip-history-card-/);
  const pressable = screen.UNSAFE_getByType(Pressable);
  const rawStyle = pressable.props.style;
  return StyleSheet.flatten(
    typeof rawStyle === "function" ? rawStyle({ pressed: true }) : rawStyle
  );
}

function expectPressedTripListItemStyle(
  screen: ReturnType<typeof renderWithAppProviders>
) {
  expect(getPressedPressableStyle(screen)).toEqual(
    GlobalStyles.pressedTripListItem
  );
}

describe("TripHistoryItem", () => {
  beforeEach(() => {
    getTripData.mockResolvedValue({
      dailyBudget: "100",
      totalBudget: "3000",
      tripCurrency: "EUR",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    http.fetchTripName.mockResolvedValue("Japan 2026");
    http.getTravellers.mockResolvedValue([{ uid: "u1", userName: "Alice" }]);
  });

  it("uses the trip list pressed style after trip data has loaded", async () => {
    const screen = renderWithAppProviders(
      <TripHistoryItem tripid="t1" trips={["t1"]} />,
      {
        trip: { tripid: "t1" },
        expenses: { expenses: [], getExpensesSum: () => 0 },
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });

    expectPressedTripListItemStyle(screen);
  });

  it("uses the trip list pressed style while trip data is loading", () => {
    getTripData.mockImplementation(() => new Promise(() => {}));
    http.fetchTripName.mockImplementation(() => new Promise(() => {}));
    http.getTravellers.mockImplementation(() => new Promise(() => {}));

    const screen = renderWithAppProviders(
      <TripHistoryItem tripid="t2" trips={["t1", "t2"]} />,
      {
        trip: { tripid: "t1" },
        expenses: { expenses: [], getExpensesSum: () => 0 },
      }
    );

    expect(screen.getByTestId("trip-history-card-t2")).toBeTruthy();
    expectPressedTripListItemStyle(screen);
  });
});
