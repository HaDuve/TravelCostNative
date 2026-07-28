import * as React from "react";
import { Pressable, StyleSheet } from "react-native";
import { waitFor } from "@testing-library/react-native";

import TripHistoryItem from "../../components/ProfileOutput/TripHistoryItem";
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

jest.mock("../../store/mmkv", () => {
  const actual = jest.requireActual("../../store/mmkv-keys");
  return {
    getMMKVObject: jest.fn(() => null),
    setMMKVObject: jest.fn(),
    MMKV_KEYS: actual.MMKV_KEYS,
    MMKV_KEY_PATTERNS: actual.MMKV_KEY_PATTERNS,
  };
});

function getPressedPressableStyle(
  screen: ReturnType<typeof renderWithAppProviders>
) {
  screen.getByTestId("trip-history-card-t1");
  const pressable = screen.UNSAFE_getByType(Pressable);
  const rawStyle = pressable.props.style;
  return StyleSheet.flatten(
    typeof rawStyle === "function" ? rawStyle({ pressed: true }) : rawStyle
  ) as Record<string, unknown>;
}

describe("TripHistoryItem", () => {
  it("uses a subtle press scale on trip list items", async () => {
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

    const pressedStyle = getPressedPressableStyle(screen);
    const transform = pressedStyle.transform as Array<{ scale: number }>;

    expect(transform).toEqual([{ scale: 0.975 }]);
  });
});
