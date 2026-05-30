import * as React from "react";
import { StyleSheet } from "react-native";

import TripList from "../../components/ProfileOutput/TripList";
import { renderWithAppProviders } from "../fixtures/app-providers";
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

  it("fills the list wrapper so trip history cards get the remaining profile height", () => {
    const screen = renderWithAppProviders(<TripList trips={["t1"]} />, {
      trip: { tripid: "t1" },
      expenses: { expenses: [], getExpensesSum: () => 0 },
    });

    const wrapper = screen.getByTestId("trip-list-wrapper");
    const flatList = wrapper.findByType(
      require("react-native").FlatList
    );
    const flat = StyleSheet.flatten(flatList.props.style) as Record<
      string,
      unknown
    >;

    expect(flat.flex).toBe(1);
  });

  it("lists every trip in history and scrolls when trips overflow the viewport", async () => {
    const screen = renderWithAppProviders(<TripList trips={["t1", "t2"]} />, {
      trip: { tripid: "t1" },
      expenses: { expenses: [], getExpensesSum: () => 0 },
    });

    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
      expect(screen.getByTestId("trip-history-card-t2")).toBeTruthy();
    });

    const wrapper = screen.getByTestId("trip-list-wrapper");
    const flatList = wrapper.findByType(
      require("react-native").FlatList
    );
    expect(flatList.props.scrollEnabled).toBe(true);
  });
});
