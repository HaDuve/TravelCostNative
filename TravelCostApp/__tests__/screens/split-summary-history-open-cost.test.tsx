import * as React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";

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
jest.mock("../../components/UI/StaticList", () => {
  const actual = jest.requireActual("../../components/UI/StaticList");
  const Wrapped = (props: unknown) => {
    (globalThis as any).__staticListRenders += 1;
    return actual.default(props);
  };
  return { __esModule: true, default: Wrapped };
});

import SplitSummaryScreen from "../../screens/SplitSummaryScreen";
import {
  addExpense,
  buildExpense,
  makeTrip,
  resetHarnessIds,
} from "../fixtures/split-summary";
import { renderWithAppProviders } from "../fixtures/app-providers";

/**
 * Opening the Change history only flips a flag; it must not make the Split
 * Summary behind the modal redo its list rendering (JS-thread stall on open).
 */
describe("Split Summary: opening Change history", () => {
  it("does not re-render the balances list behind the modal", async () => {
    (globalThis as any).__staticListRenders = 0;
    resetHarnessIds();
    const trip = makeTrip(["Alice", "Bob"]);
    addExpense(
      trip,
      buildExpense(trip, {
        amount: 100,
        whoPaid: "Alice",
        description: "Dinner",
      }),
    );
    const screen = renderWithAppProviders(
      <SplitSummaryScreen
        navigation={{ navigate: jest.fn(), pop: jest.fn() } as any}
      />,
      {
        trip: {
          tripid: "t1",
          tripCurrency: "EUR",
          isPaid: "notPaid",
          isPaidTimestamp: 0,
        },
        user: { userName: "Alice", freshlyCreated: false },
        expenses: { expenses: trip.expenses },
      },
    );
    const button = await screen.findByTestId("split-summary-history");
    await waitFor(() =>
      expect(screen.getByTestId("split-balance-row-Bob-Alice")).toBeTruthy(),
    );
    const before = (globalThis as any).__staticListRenders;

    fireEvent.press(button);
    await screen.findByTestId("split-history-empty");

    const after = (globalThis as any).__staticListRenders;
    // eslint-disable-next-line no-console
    console.log(
      `[open-cost] list renders caused by opening: ${after - before}`,
    );
    expect(after - before).toBe(0);
  });
});
