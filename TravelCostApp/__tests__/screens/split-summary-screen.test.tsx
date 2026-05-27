import * as React from "react";
import { waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: jest.fn(),
  };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
  default: { show: jest.fn(), hide: jest.fn() },
}));

import SplitSummaryScreen from "../../screens/SplitSummaryScreen";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("Split Summary screen", () => {
  it("lists an open Balance from fixture expenses via calcOpenSplitsTable", async () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn() };
    const screen = renderWithAppProviders(
      <SplitSummaryScreen navigation={navigation as any} />,
      {
        trip: {
          tripid: "t1",
          tripCurrency: "EUR",
          isPaid: "notPaid",
          isPaidTimestamp: 0,
          fetchAndSettleCurrentTrip: jest.fn(async () => {}),
        },
        user: { userName: "Alice", freshlyCreated: false },
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
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Split Summary")).toBeTruthy();
      expect(screen.getByText("Bob")).toBeTruthy();
      expect(screen.getByText("Alice")).toBeTruthy();
    });
  });
});
