import * as React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useFocusEffect: jest.fn() };
});
jest.mock("../../util/vexo-tracking", () => ({ trackEvent: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

import SplitSummaryScreen from "../../screens/SplitSummaryScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import {
  addExpense,
  buildExpense,
  equalSplit,
  makeTrip,
  resetHarnessIds,
} from "../fixtures/split-summary";

beforeEach(() => resetHarnessIds());

describe("Split Summary screen: Balance simplification off / on", () => {
  // Expense order matters here: with Bob's Expense added second, simplifySplits
  // also returns a stray 0.00 Alice->Bob row (separate bug, not asserted here).
  it("lists every open Balance when off; pressing Simplify collapses the chain to the same nets", async () => {
    const trip = makeTrip(["Alice", "Bob", "Carol"]);
    // Carol paid 20 shared by Bob+Carol: Bob owes Carol 10.
    addExpense(
      trip,
      buildExpense(trip, {
        amount: 20,
        whoPaid: "Carol",
        splitList: equalSplit(20, ["Bob", "Carol"]),
      })
    );

    // Bob paid 20 shared by Alice+Bob: Alice owes Bob 10.
    addExpense(
      trip,
      buildExpense(trip, {
        amount: 20,
        whoPaid: "Bob",
        splitList: equalSplit(20, ["Alice", "Bob"]),
      })
    );

    const navigation = { navigate: jest.fn(), pop: jest.fn() };
    const screen = renderWithAppProviders(
      <SplitSummaryScreen navigation={navigation as any} />,
      {
        trip: {
          tripid: "t1",
          tripCurrency: trip.tripCurrency,
          isPaid: "notPaid",
          isPaidTimestamp: trip.isPaidTimestamp,
          fetchAndSettleCurrentTrip: jest.fn(async () => {}),
        },
        user: { userName: "Alice", freshlyCreated: false },
        expenses: { expenses: trip.expenses },
        orientation: { isPortrait: true, isLandscape: false, isTablet: false },
      }
    );

    // Off: every Balance listed.
    await waitFor(() => {
      expect(screen.getByTestId("split-balance-row-Alice-Bob")).toBeTruthy();
      expect(screen.getByTestId("split-balance-row-Bob-Carol")).toBeTruthy();
    });
    expect(screen.queryByTestId("split-balance-row-Alice-Carol")).toBeNull();

    // On: the real Simplify action.
    fireEvent.press(screen.getByTestId("split-summary-simplify"));

    await waitFor(() => {
      expect(screen.getByTestId("split-balance-row-Alice-Carol")).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.queryByTestId("split-balance-row-Alice-Bob")).toBeNull();
      expect(screen.queryByTestId("split-balance-row-Bob-Carol")).toBeNull();
    });
  });
});
