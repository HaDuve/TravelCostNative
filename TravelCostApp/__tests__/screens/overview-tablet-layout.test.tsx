import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { fireEvent, within } from "@testing-library/react-native";

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
  return function MockDropDownPicker(props: { containerStyle?: object }) {
    return <View testID="mock-dropdown-picker" style={props.containerStyle} />;
  };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("react-native-toast-message/lib/src/Toast", () => ({
  Toast: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("../../components/UI/ToastComponent", () => ({
  showBanner: jest.fn(),
}));

jest.mock("../../components/charts/WebViewChart", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function MockWebViewChart(props: { width?: number; height?: number }) {
    return (
      <View
        testID="mock-webview-chart"
        style={{ width: props.width, height: props.height }}
      />
    );
  };
});

import OverviewScreen from "../../screens/OverviewScreen";
import LayoutContextProvider from "../../store/layout-context";
import OrientationContextProvider from "../../store/orientation-context";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

const monthExpenses = [
  makeExpense({ id: "e1", calcAmount: 75, amount: 75, category: "Food" }),
];

const graphExpensesContext = {
  expenses: monthExpenses,
  getRecentExpenses: () => monthExpenses,
  getMonthlyExpenses: () => ({
    firstDay: new Date("2026-05-01"),
    lastDay: new Date("2026-05-31"),
    monthlyExpenses: monthExpenses,
  }),
};

function renderOverviewWithLayout(
  width: number,
  height: number,
  options: { isShowingGraph?: boolean; expenses?: object } = {}
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
        <OverviewScreen navigation={{ navigate: jest.fn() } as any} />
      </OrientationContextProvider>
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
      user: {
        isShowingGraph: options.isShowingGraph ?? false,
        setIsShowingGraph: jest.fn(),
        periodName: "month",
      },
      expenses: options.expenses ?? {
        expenses: monthExpenses,
        getRecentExpenses: () => monthExpenses,
      },
    }
  );
}

describe("Overview tablet layout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps summary in the period chrome on phone widths", () => {
    const screen = renderOverviewWithLayout(390, 844);

    expect(screen.getByTestId("mock-dropdown-picker")).toBeTruthy();
    expect(screen.getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(screen.queryByTestId("overview-body-grid")).toBeNull();
  });

  it("keeps summary in the period chrome on medium widths", () => {
    const screen = renderOverviewWithLayout(700, 900);

    expect(screen.getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(screen.queryByTestId("overview-body-grid")).toBeNull();
  });

  it("uses a 30/70 summary and chart grid on wide layouts", () => {
    const screen = renderOverviewWithLayout(1194, 834);
    const grid = screen.getByTestId("overview-body-grid");
    const [leftColumn, rightColumn] = screen.getAllByTestId(
      "responsive-grid-column"
    );

    const leftStyle = StyleSheet.flatten(leftColumn.props.style) as Record<
      string,
      unknown
    >;
    const rightStyle = StyleSheet.flatten(rightColumn.props.style) as Record<
      string,
      unknown
    >;

    expect(leftStyle.flexGrow).toBe(3);
    expect(rightStyle.flexGrow).toBe(7);
    expect(within(leftColumn).getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(within(rightColumn).getByTestId("mock-webview-chart")).toBeTruthy();
    expect(within(grid).getByTestId("expenses-summary-pressable")).toBeTruthy();
  });

  it("caps pie charts through ChartController on wide layouts", () => {
    const screen = renderOverviewWithLayout(1194, 834);
    fireEvent(screen.getByTestId("overview-chart-column"), "layout", {
      nativeEvent: { layout: { width: 520, height: 400, x: 0, y: 0 } },
    });
    const chart = screen.getByTestId("mock-webview-chart");
    const chartStyle = StyleSheet.flatten(chart.props.style) as Record<
      string,
      unknown
    >;

    expect(chartStyle.width).toBeLessThanOrEqual(400);
    expect(chartStyle.height).toBeLessThanOrEqual(400);
    expect(chartStyle.width).toBeLessThanOrEqual(520);
  });

  it("sizes bar charts to the measured chart column width on wide layouts", () => {
    const screen = renderOverviewWithLayout(1194, 834, {
      isShowingGraph: true,
      expenses: graphExpensesContext,
    });

    fireEvent(screen.getByTestId("overview-chart-column"), "layout", {
      nativeEvent: { layout: { width: 520, height: 400, x: 0, y: 0 } },
    });

    const chart = screen.getByTestId("mock-webview-chart");
    const chartStyle = StyleSheet.flatten(chart.props.style) as Record<
      string,
      unknown
    >;

    expect(chartStyle.width).toBeLessThanOrEqual(520);
    expect(chartStyle.width).toBeLessThanOrEqual(600);
  });
});
