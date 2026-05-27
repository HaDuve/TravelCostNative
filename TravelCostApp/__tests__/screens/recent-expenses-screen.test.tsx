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

jest.mock("../../components/ExpensesOutput/ExpensesOutput", () => ({
  MemoizedExpensesOutput: () => null,
}));

jest.mock("../../components/ManageExpense/AddExpenseButton", () => () => null);
jest.mock("../../components/UI/MiniSyncIndicator", () => () => null);

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
}));

import { waitFor } from "@testing-library/react-native";
import RecentExpenses from "../../screens/RecentExpenses";
import { fetchAndSetExpenses } from "../../components/ExpensesOutput/RecentExpensesUtil";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("RecentExpenses screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
  });

  it("fetches expenses after the offline queue flushes successfully", async () => {
    mmkvStore.offlineQueue = [{ type: "add", expense: { tripid: "t1" } }];

    const navigation = { navigate: jest.fn() };
    renderWithAppProviders(<RecentExpenses navigation={navigation as any} />, {
      expenses: {
        expenses: [],
        getRecentExpenses: () => [],
        loadExpensesFromStorage: jest.fn(async () => {}),
      },
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

    expect(screen.getByText(/Japan 2026/)).toBeTruthy();
    expect(screen.getByText(/75/)).toBeTruthy();
  });
});
