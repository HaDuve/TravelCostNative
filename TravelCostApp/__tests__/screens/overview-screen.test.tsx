import * as React from "react";

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

jest.mock("../../components/ExpensesOutput/ExpensesOverview", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const actual = jest.requireActual(
    "../../components/ExpensesOutput/ExpensesOverview"
  );
  const ActualExpensesOverview = actual.default;
  return {
    ...actual,
    MemoizedExpensesOverview: (props: {
      refreshControl?: React.ReactElement;
    }) => (
      <>
        {props.refreshControl ? (
          <Text testID="overview-refresh-control">refresh</Text>
        ) : null}
        <ActualExpensesOverview {...props} />
      </>
    ),
  };
});

import OverviewScreen from "../../screens/OverviewScreen";
import LayoutContextProvider from "../../store/layout-context";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { makeExpense } from "../fixtures/expense";
import { assertNoNestedVerticalFlatLists } from "../../test-utils/scroll-composition";
import { Dimensions, StyleSheet } from "react-native";

const graphExpensesContext = {
  expenses: [makeExpense({ category: "Food", calcAmount: 42 })],
  getRecentExpenses: () => [makeExpense({ category: "Food", calcAmount: 42 })],
  getMonthlyExpenses: () => ({
    firstDay: new Date("2026-05-01"),
    lastDay: new Date("2026-05-31"),
    monthlyExpenses: [makeExpense({ category: "Food", calcAmount: 42 })],
  }),
};

describe("Overview screen", () => {
  it("shows the trip name in the header", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: { expenses: [], getRecentExpenses: () => [] },
      }
    );

    expect(screen.getByText(/Japan 2026/)).toBeTruthy();
  });

  it("does not nest vertical FlatList inside ScrollView in pie mode", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: {
          expenses: [makeExpense()],
          getRecentExpenses: () => [makeExpense()],
        },
      }
    );

    assertNoNestedVerticalFlatLists(screen.root);
  });

  it("does not nest vertical FlatList inside ScrollView in graph mode", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          isShowingGraph: true,
          setIsShowingGraph: jest.fn(),
        },
        expenses: graphExpensesContext,
      }
    );

    assertNoNestedVerticalFlatLists(screen.root);
  });

  it("passes pull-to-refresh control to the graph statistics section", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          isShowingGraph: true,
          setIsShowingGraph: jest.fn(),
        },
        expenses: graphExpensesContext,
      }
    );

    expect(screen.getByTestId("overview-refresh-control")).toBeTruthy();
  });

  it("shows pie chart statistics when graph mode is off", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: {
          expenses: [makeExpense({ category: "Food" })],
          getRecentExpenses: () => [makeExpense({ category: "Food" })],
        },
      }
    );

    expect(screen.getByText(/categories/i)).toBeTruthy();
  });

  it("passes pull-to-refresh control to the statistics section", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: { expenses: [], getRecentExpenses: () => [] },
      }
    );

    expect(screen.getByTestId("overview-refresh-control")).toBeTruthy();
  });

  it("does not redirect to Profile when leftover gate flag is set on an Active trip", () => {
    const Toast = require("react-native-toast-message/lib/src/Toast").Toast;
    const navigation = { navigate: jest.fn() };

    renderWithAppProviders(<OverviewScreen navigation={navigation as any} />, {
      user: {
        freshlyCreated: true,
        isShowingGraph: false,
        setIsShowingGraph: jest.fn(),
      },
      expenses: { expenses: [], getRecentExpenses: () => [] },
      trip: {
        tripid: "t-implicit",
        tripName: "",
        tripCurrency: "EUR",
        isImplicitDefault: true,
      },
    });

    expect(navigation.navigate).not.toHaveBeenCalledWith("Profile");
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it("wraps overview content in an 800px ContentFrame on wide layouts", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 1194,
      height: 834,
      scale: 2,
      fontScale: 1,
    });

    const screen = renderWithAppProviders(
      <LayoutContextProvider>
        <OverviewScreen navigation={{ navigate: jest.fn() } as any} />
      </LayoutContextProvider>,
      {
        user: {
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: { expenses: [], getRecentExpenses: () => [] },
      }
    );

    const frame = StyleSheet.flatten(
      screen.getByTestId("overview-content-frame").props.style
    ) as Record<string, unknown>;

    expect(frame.maxWidth).toBe(800);
    expect(frame.alignSelf).toBe("center");
  });
});
