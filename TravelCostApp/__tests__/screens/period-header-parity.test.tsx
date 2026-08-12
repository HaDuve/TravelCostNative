import * as React from "react";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useScrollToTop: jest.fn(),
    useFocusEffect: jest.fn(),
  };
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

import OverviewScreen from "../../screens/OverviewScreen";
import RecentExpenses from "../../screens/RecentExpenses";
import TripPeriodChrome from "../../components/layout/TripPeriodChrome";
import LayoutContextProvider from "../../store/layout-context";
import OrientationContextProvider from "../../store/orientation-context";
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

function renderScreenWithLayout(
  Screen: typeof OverviewScreen | typeof RecentExpenses,
  width: number,
  height: number
) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 2,
    fontScale: 1,
  });

  return renderWithAppProviders(
    <LayoutContextProvider>
      <OrientationContextProvider>
        <Screen navigation={{ navigate: jest.fn() } as any} />
      </OrientationContextProvider>
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
      user: {
        isShowingGraph: false,
        setIsShowingGraph: jest.fn(),
        periodName: "month",
      },
      expenses: {
        expenses: monthExpenses,
        getRecentExpenses: () => monthExpenses,
      },
    }
  );
}

describe("period header parity", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("TripPeriodChrome keeps the same date header spacing with or without sync slot", () => {
    const withSync = flattenDateHeaderStyle(
      renderWithAppProviders(
        <LayoutContextProvider>
          <TripPeriodChrome
            tripLabel="Japan 2026 - Aug 2026"
            syncSlot={<></>}
            periodValue="month"
            periodItems={[{ label: "Month", value: "month" }]}
            periodOpen={false}
            onPeriodOpenChange={jest.fn()}
            onPeriodValueChange={jest.fn()}
            onPeriodItemsChange={jest.fn()}
            expenses={monthExpenses}
          />
        </LayoutContextProvider>,
        { wrapNavigation: false }
      )
    );

    const withoutSync = flattenDateHeaderStyle(
      renderWithAppProviders(
        <LayoutContextProvider>
          <TripPeriodChrome
            tripLabel="Japan 2026 - Aug 2026"
            periodValue="month"
            periodItems={[{ label: "Month", value: "month" }]}
            periodOpen={false}
            onPeriodOpenChange={jest.fn()}
            onPeriodValueChange={jest.fn()}
            onPeriodItemsChange={jest.fn()}
            expenses={monthExpenses}
          />
        </LayoutContextProvider>,
        { wrapNavigation: false }
      )
    );

    expect(withSync.marginTop).toBe(withoutSync.marginTop);
    expect(withSync.marginLeft).toBe(withoutSync.marginLeft);
    expect(withSync.marginBottom).toBe(withoutSync.marginBottom);
  });

  it("Overview and Recent Expenses share TripPeriodChrome header layout on tablet landscape", () => {
    const overview = renderScreenWithLayout(OverviewScreen, 1194, 834);
    const recent = renderScreenWithLayout(RecentExpenses, 1194, 834);

    const overviewRow = flattenHeaderStyle(overview);
    const recentRow = flattenHeaderStyle(recent);
    const overviewDate = flattenDateHeaderStyle(overview);
    const recentDate = flattenDateHeaderStyle(recent);

    expect(overviewRow.gap).toBe(recentRow.gap);
    expect(overviewRow.marginTop).toBe(recentRow.marginTop);
    expect(overviewRow.paddingHorizontal).toBe(recentRow.paddingHorizontal);
    expect(overviewDate.marginBottom).toBe(recentDate.marginBottom);
    expect(Number(overviewDate.marginBottom)).toBeGreaterThanOrEqual(0);
  });
});
