import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";

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
import LayoutContextProvider from "../../store/layout-context";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { layoutFor } from "../../util/layout";

function renderSplitSummaryAt(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 3,
    fontScale: 1,
  });

  const navigation = { navigate: jest.fn(), pop: jest.fn(), popToTop: jest.fn() };

  return renderWithAppProviders(
    <LayoutContextProvider>
      <SplitSummaryScreen navigation={navigation as any} />
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
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
      orientation: {
        isPortrait: height > width,
        isLandscape: width > height,
        isTablet: width >= 768,
      },
    }
  );
}

describe("SplitSummary tablet layout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("wraps balances in a centered 800px ContentFrame on wide viewports", async () => {
    const screen = renderSplitSummaryAt(1194, 834);
    const frame = StyleSheet.flatten(
      screen.getByTestId("split-summary-content-frame").props.style
    ) as Record<string, unknown>;

    expect(frame.maxWidth).toBe(800);
    expect(frame.alignSelf).toBe("center");
  });

  it("spaces balance rows with layout tokens instead of stretched list padding", async () => {
    const layout = layoutFor({ width: 1194, height: 834 });
    const screen = renderSplitSummaryAt(1194, 834);
    const list = screen.getByTestId("split-summary-balance-list");
    const listStyle = StyleSheet.flatten(list.props.style) as Record<
      string,
      unknown
    >;

    expect(listStyle.paddingHorizontal).toBe(layout.space(3));
  });
});
