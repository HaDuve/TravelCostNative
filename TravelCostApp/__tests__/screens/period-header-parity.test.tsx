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

jest.mock("rn-tourguide", () => ({
  TourGuideZone: ({ children }: any) => <>{children}</>,
}));

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

import { StyleSheet } from "react-native";

import OverviewScreen from "../../screens/OverviewScreen";
import RecentExpenses from "../../screens/RecentExpenses";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

const monthExpenses = [
  makeExpense({ id: "e1", calcAmount: 75, amount: 75 }),
];

function flattenHeaderStyle(screen: { getByTestId: (id: string) => any }) {
  return StyleSheet.flatten(
    screen.getByTestId("period-header-row").props.style
  ) as Record<string, unknown>;
}

function flattenDateHeaderStyle(screen: { getByTestId: (id: string) => any }) {
  return StyleSheet.flatten(
    screen.getByTestId("period-date-header").props.style
  ) as Record<string, unknown>;
}

describe("period header parity", () => {
  it("Overview and Recent Expenses share the same period header row layout", () => {
    const navigation = { navigate: jest.fn() };
    const sharedRow = StyleSheet.flatten(
      shadowRegressionStyles.overviewPeriodHeaderRow
    ) as Record<string, unknown>;

    const overview = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          needsTour: false,
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: {
          expenses: monthExpenses,
          getRecentExpenses: () => monthExpenses,
        },
      }
    );

    const recent = renderWithAppProviders(
      <RecentExpenses navigation={navigation as any} />,
      {
        expenses: {
          expenses: monthExpenses,
          getRecentExpenses: () => monthExpenses,
        },
        user: {
          periodName: "month",
          needsTour: false,
        },
      }
    );

    const overviewRow = flattenHeaderStyle(overview);
    const recentRow = flattenHeaderStyle(recent);

    expect(overviewRow.gap).toBe(sharedRow.gap);
    expect(recentRow.gap).toBe(sharedRow.gap);
    expect(overviewRow.marginTop).toBe(recentRow.marginTop);
    expect(overviewRow.paddingHorizontal).toBe(recentRow.paddingHorizontal);
    expect(overviewRow.alignItems).toBe("stretch");
  });

  it("Overview and Recent Expenses share the same trip date header spacing", () => {
    const navigation = { navigate: jest.fn() };
    const sharedDateHeader = StyleSheet.flatten(
      shadowRegressionStyles.overviewPeriodDateHeader
    ) as Record<string, unknown>;

    const overview = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          needsTour: false,
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: {
          expenses: monthExpenses,
          getRecentExpenses: () => monthExpenses,
        },
      }
    );

    const recent = renderWithAppProviders(
      <RecentExpenses navigation={navigation as any} />,
      {
        expenses: {
          expenses: monthExpenses,
          getRecentExpenses: () => monthExpenses,
        },
        user: {
          periodName: "month",
          needsTour: false,
        },
      }
    );

    const overviewDate = flattenDateHeaderStyle(overview);
    const recentDate = flattenDateHeaderStyle(recent);

    expect(overviewDate.marginTop).toBe(sharedDateHeader.marginTop);
    expect(recentDate.marginTop).toBe(sharedDateHeader.marginTop);
    expect(overviewDate.marginLeft).toBe(recentDate.marginLeft);
    expect(overviewDate.marginBottom).toBe(recentDate.marginBottom);
  });
});
