import * as React from "react";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useScrollToTop: jest.fn() };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
  identifyUser: jest.fn(async () => {}),
  initializeVexo: jest.fn(async () => true),
  VexoUserContext: {},
}));

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("../../components/ExpensesOutput/ExpensesOutput", () =>
  jest.requireActual("../../components/ExpensesOutput/ExpensesOutput")
);

jest.mock("../../components/ManageExpense/AddExpenseButton", () => () => null);
jest.mock("../../components/UI/MiniSyncIndicator", () => () => null);

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

jest.mock("rn-tourguide", () => ({
  TourGuideZone: ({ children }: any) => <>{children}</>,
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("../../util/refreshWithToast", () => ({
  refreshWithToast: jest.fn(async () => {}),
}));

const mmkvStore: Record<string, unknown> = {};

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: { OFFLINE_QUEUE: "offlineQueue" },
  getMMKVObject: jest.fn((key: string) => mmkvStore[key] ?? null),
  setMMKVObject: jest.fn((key: string, value: unknown) => {
    mmkvStore[key] = value;
  }),
}));

jest.mock("../../util/offline-queue", () => ({
  getOfflineQueue: jest.fn(async () => mmkvStore.offlineQueue ?? []),
  sendOfflineQueue: jest.fn(async () => {
    mmkvStore.offlineQueue = [];
  }),
}));

jest.mock("../../components/ExpensesOutput/RecentExpensesUtil", () => ({
  fetchAndSetExpenses: jest.fn(async () => {}),
}));

jest.mock("../../util/http", () => ({
  fetchTravelerIsTouched: jest.fn(async () => true),
  fetchTripName: jest.fn(async () => "Japan 2026"),
  touchAllTravelers: jest.fn(async () => {}),
}));

jest.mock("react-native-toast-message/lib/src/Toast", () => ({
  Toast: { show: jest.fn(), hide: jest.fn() },
}));

import { waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import RecentExpenses from "../../screens/RecentExpenses";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { fetchAndSetExpenses } from "../../components/ExpensesOutput/RecentExpensesUtil";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertNoNestedVerticalFlatLists } from "../../test-utils/scroll-composition";

function expensesContextForList(
  listedExpenses: ReturnType<typeof makeExpense>[]
) {
  return {
    expenses: listedExpenses,
    getRecentExpenses: () => listedExpenses,
    getDailyExpenses: jest.fn(() => []),
    loadExpensesFromStorage: jest.fn(async () => {}),
    deleteExpense: jest.fn(),
  };
}

describe("RecentExpenses screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
  });

  it("fetches expenses after the offline queue flushes successfully", async () => {
    mmkvStore.offlineQueue = [{ type: "add", expense: { tripid: "t1" } }];

    const navigation = { navigate: jest.fn() };
    renderWithAppProviders(<RecentExpenses navigation={navigation as any} />, {
      expenses: expensesContextForList([]),
      network: { isConnected: true, strongConnection: true },
    });

    await waitFor(() => {
      expect(fetchAndSetExpenses).toHaveBeenCalled();
    });
  });

  it("shows the trip name and period expense total from ExpensesSummary", () => {
    const monthExpenses = [makeExpense({ id: "e1", calcAmount: 75, amount: 75 })];
    const navigation = { navigate: jest.fn() };

    const screen = renderWithAppProviders(
      <RecentExpenses navigation={navigation as any} />,
      {
        expenses: expensesContextForList(monthExpenses),
        user: {
          periodName: "month",
          needsTour: false,
        },
      }
    );

    expect(screen.getByText(/Japan 2026/)).toBeTruthy();
    expect(screen.getByText(/75/)).toBeTruthy();
  });

  it("uses the same period header card chrome as Overview", () => {
    const monthExpenses = [makeExpense({ id: "e1", calcAmount: 75, amount: 75 })];
    const navigation = { navigate: jest.fn() };

    const screen = renderWithAppProviders(
      <RecentExpenses navigation={navigation as any} />,
      {
        expenses: expensesContextForList(monthExpenses),
        user: {
          periodName: "month",
          needsTour: false,
        },
      }
    );

    const dropdown = StyleSheet.flatten(
      screen.getByTestId("mock-dropdown-picker").props.style
    ) as Record<string, unknown>;
    const overviewDropdown = StyleSheet.flatten(
      shadowRegressionStyles.overviewDropdownContainer
    ) as Record<string, unknown>;

    expect(dropdown.flex).toBe(overviewDropdown.flex);
    expect(dropdown.maxWidth).toBe(overviewDropdown.maxWidth);
    expect(dropdown.borderWidth).toBe(overviewDropdown.borderWidth);
    expect(dropdown.minHeight).toBe(overviewDropdown.minHeight);
    expect(dropdown.justifyContent).toBe("center");
  });

  it("does not nest vertical FlatList inside ScrollView when expenses are listed", async () => {
    const monthExpenses = [
      makeExpense({ id: "e1", calcAmount: 75, amount: 75, description: "Coffee" }),
      makeExpense({ id: "e2", calcAmount: 25, amount: 25, description: "Lunch" }),
    ];
    const navigation = { navigate: jest.fn(), popToTop: jest.fn() };

    const screen = renderWithAppProviders(
      <RecentExpenses navigation={navigation as any} />,
      {
        expenses: expensesContextForList(monthExpenses),
        user: {
          periodName: "month",
          needsTour: false,
          freshlyCreated: false,
        },
        trip: {
          tripName: "Japan 2026",
          fetchAndSetTravellers: jest.fn(async () => {}),
        },
        network: { isConnected: true, strongConnection: true },
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeTruthy();
    });

    assertNoNestedVerticalFlatLists(screen.root);
  });
});
