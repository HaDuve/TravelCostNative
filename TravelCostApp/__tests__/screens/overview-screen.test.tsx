import * as React from "react";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockDropDownPicker() {
    return <Text testID="mock-dropdown-picker" />;
  };
});

jest.mock("rn-tourguide", () => ({
  TourGuideZone: ({ children }: any) => <>{children}</>,
}));

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
import { renderWithAppProviders } from "../fixtures/app-providers";
import { makeExpense } from "../fixtures/expense";
import { assertNoNestedVerticalFlatLists } from "../../test-utils/scroll-composition";

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
          needsTour: false,
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
          needsTour: false,
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
          needsTour: false,
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
          needsTour: false,
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
          needsTour: false,
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
          needsTour: false,
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: { expenses: [], getRecentExpenses: () => [] },
      }
    );

    expect(screen.getByTestId("overview-refresh-control")).toBeTruthy();
  });
});
