import * as React from "react";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useScrollToTop: jest.fn() };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function MockDropDownPicker(props: {
    containerStyle?: object;
    style?: object;
  }) {
    return (
      <View
        testID="mock-dropdown-picker"
        style={[props.containerStyle, props.style]}
      />
    );
  };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
  identifyUser: jest.fn(async () => {}),
  initializeVexo: jest.fn(async () => true),
  VexoUserContext: {},
}));

jest.mock("react-native-toast-message/lib/src/Toast", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("../../components/UI/ToastComponent", () => ({
  showBanner: jest.fn(),
}));

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("../../components/ExpensesOutput/ExpensesOverview", () => {
  const React = require("react");
  return {
    MemoizedExpensesOverview: () => null,
  };
});
jest.mock("../../components/ExpensesOutput/ExpensesOutput", () => ({
  MemoizedExpensesOutput: () => null,
}));
jest.mock("../../components/ManageExpense/AddExpenseButton", () => () => null);
jest.mock("../../components/UI/MiniSyncIndicator", () => () => null);
jest.mock("../../components/ExpensesOutput/RecentExpensesUtil", () => ({
  fetchAndSetExpenses: jest.fn(async () => {}),
}));
jest.mock("../../util/http", () => ({
  fetchTravelerIsTouched: jest.fn(async () => true),
}));
jest.mock("../../util/refreshWithToast", () => ({
  refreshWithToast: jest.fn(async () => {}),
}));

import { Dimensions, StyleSheet } from "react-native";

import RecentExpenses from "../../screens/RecentExpenses";
import LayoutContextProvider from "../../store/layout-context";
import OrientationContextProvider from "../../store/orientation-context";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

const monthExpenses = [
  makeExpense({ id: "e1", calcAmount: 75, amount: 75 }),
];

function flattenScreenContainer(screen: { getByTestId: (id: string) => any }) {
  return StyleSheet.flatten(
    screen.getByTestId("recent-expenses-screen").props.style
  ) as Record<string, unknown>;
}

function renderRecentExpensesWithLayout(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 3,
    fontScale: 1,
  });

  return renderWithAppProviders(
    <LayoutContextProvider>
      <OrientationContextProvider>
        <RecentExpenses navigation={{ navigate: jest.fn() } as any} />
      </OrientationContextProvider>
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
      expenses: {
        expenses: monthExpenses,
        getRecentExpenses: () => monthExpenses,
      },
      user: {
        periodName: "month",
      },
    }
  );
}

describe("RecentExpenses tablet layout adapter", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not apply tablet padding on phone portrait widths", () => {
    const screen = renderRecentExpensesWithLayout(390, 844);
    const container = flattenScreenContainer(screen);

    expect(container.paddingTop).toBeUndefined();
  });

  it("applies tablet padding when the layout profile is no longer narrow", () => {
    const portrait = flattenScreenContainer(renderRecentExpensesWithLayout(390, 844));
    const landscape = flattenScreenContainer(renderRecentExpensesWithLayout(844, 390));

    expect(portrait.paddingTop).toBeUndefined();
    expect(landscape.paddingTop).toBeGreaterThan(0);
  });
});
