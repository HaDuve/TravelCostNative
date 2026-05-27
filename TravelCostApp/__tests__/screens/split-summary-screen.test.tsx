import * as React from "react";
import { waitFor } from "@testing-library/react-native";

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

jest.mock("../../util/split", () => {
  const actual = jest.requireActual("../../util/split");
  return {
    ...actual,
    calcOpenSplitsTable: jest.fn(async () => [
      { userName: "Bob", whoPaid: "Alice", amount: 20 },
    ]),
  };
});

import SplitSummaryScreen from "../../screens/SplitSummaryScreen";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("Split Summary screen", () => {
  it("lists an open Balance between travellers", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <SplitSummaryScreen navigation={navigation as any} />,
      {
        trip: {
          tripCurrency: "EUR",
          isPaid: "notPaid",
          isPaidTimestamp: 0,
          fetchAndSettleCurrentTrip: jest.fn(async () => {}),
        },
        user: { userName: "Alice" },
        expenses: {
          expenses: [makeExpense()],
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
