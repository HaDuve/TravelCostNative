import * as React from "react";
import { StyleSheet } from "react-native";

import TripList from "../../components/ProfileOutput/TripList";
import { renderWithAppProviders } from "../fixtures/app-providers";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../util/http", () => ({
  fetchTripName: jest.fn(async () => "Japan 2026"),
  getTravellers: jest.fn(async () => ["Alice", "Bob"]),
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

describe("TripList", () => {
  it("does not paint trip cards behind sibling profile content", () => {
    const screen = renderWithAppProviders(<TripList trips={["t1"]} />, {
      trip: { tripid: "t1" },
      expenses: { expenses: [], getExpensesSum: () => 0 },
    });

    const wrapper = screen.getByTestId("trip-list-wrapper");
    const flat = StyleSheet.flatten(wrapper.props.style) as Record<
      string,
      unknown
    >;

    expect(flat.zIndex == null || Number(flat.zIndex) >= 0).toBe(true);
  });
});
