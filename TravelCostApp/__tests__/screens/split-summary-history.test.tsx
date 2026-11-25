import * as React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor, within } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useFocusEffect: jest.fn(),
}));
jest.mock("../../util/vexo-tracking", () => ({ trackEvent: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
  default: { show: jest.fn(), hide: jest.fn() },
}));
jest.mock("../../util/http", () => ({
  fetchSplitHistoryPage: jest.fn(async () => ({ entries: [], hasMore: false })),
  appendSplitHistoryEntry: jest.fn(async () => undefined),
  SPLIT_HISTORY_PAGE_SIZE: 20,
}));

import SplitSummaryScreen from "../../screens/SplitSummaryScreen";
import { appendSplitHistoryEntry, fetchSplitHistoryPage } from "../../util/http";
import { addExpense, buildExpense, makeTrip, resetHarnessIds } from "../fixtures/split-summary";
import { renderWithAppProviders } from "../fixtures/app-providers";

function renderScreen(fetchAndSettleCurrentTrip = jest.fn(async () => {})) {
  resetHarnessIds();
  const trip = makeTrip(["Alice", "Bob"]);
  addExpense(trip, buildExpense(trip, { amount: 100, whoPaid: "Alice", description: "Dinner" }));
  const navigation = { navigate: jest.fn(), pop: jest.fn(), popToTop: jest.fn() };
  const screen = renderWithAppProviders(
    <SplitSummaryScreen navigation={navigation as any} />,
    {
      trip: {
        tripid: "t1",
        tripCurrency: "EUR",
        isPaid: "notPaid",
        isPaidTimestamp: 0,
        fetchAndSettleCurrentTrip,
      },
      user: { userName: "Alice", freshlyCreated: false },
      expenses: { expenses: trip.expenses },
    }
  );
  return { screen, fetchAndSettleCurrentTrip };
}

describe("Split Summary change history", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers Change history as a secondary button that opens the history modal", async () => {
    const { screen } = renderScreen();

    const button = await screen.findByTestId("split-summary-history");
    expect(within(button).getByText("Change history")).toBeTruthy();
    expect(screen.queryByTestId("split-history-modal")).toBeNull();
    expect(fetchSplitHistoryPage).not.toHaveBeenCalled();

    fireEvent.press(button);

    await waitFor(() => expect(fetchSplitHistoryPage).toHaveBeenCalledWith("t1", { beforeId: undefined }));
    expect(await screen.findByTestId("split-history-empty")).toBeTruthy();
  });

  it("keeps Change history available when there are no open Balances", async () => {
    resetHarnessIds();
    const screen = renderWithAppProviders(
      <SplitSummaryScreen navigation={{ navigate: jest.fn(), pop: jest.fn() } as any} />,
      {
        trip: { tripid: "t1", tripCurrency: "EUR", isPaid: "paid", isPaidTimestamp: 1 },
        user: { userName: "Alice", freshlyCreated: false },
        expenses: { expenses: [] },
      }
    );
    expect(await screen.findByTestId("split-summary-history")).toBeTruthy();
  });

  it("writes one Settlement entry that clears every open Balance", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { screen, fetchAndSettleCurrentTrip } = renderScreen();

    fireEvent.press(await screen.findByTestId("split-summary-settle"));
    const confirm = (alert.mock.calls[0][2] as any[]).find((b) => b.text === "Settle");
    await confirm.onPress();

    expect(fetchAndSettleCurrentTrip).toHaveBeenCalledTimes(1);
    expect(appendSplitHistoryEntry).toHaveBeenCalledTimes(1);
    const [tripid, entry] = (appendSplitHistoryEntry as jest.Mock).mock.calls[0];
    expect(tripid).toBe("t1");
    expect(entry).toMatchObject({ kind: "settlement", byName: "Alice", tripCurrency: "EUR" });
    expect(entry.balanceChanges).toEqual([
      { userName: "Bob", amount: 50 },
      { userName: "Alice", amount: -50 },
    ]);
    alert.mockRestore();
  });
});
