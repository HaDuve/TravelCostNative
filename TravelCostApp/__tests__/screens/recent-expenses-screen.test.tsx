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

jest.mock("../../components/ManageExpense/AddExpenseButton", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockAddExpenseButton() {
    return <Text testID="add-expense-entry">add expense</Text>;
  };
});
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
  MMKV_KEY_PATTERNS: {
    NAMING_BANNER_DISMISSED: (tripid: string) =>
      `namingBannerDismissed_${tripid}`,
  },
  getMMKVObject: jest.fn((key: string) => mmkvStore[key] ?? null),
  setMMKVObject: jest.fn((key: string, value: unknown) => {
    mmkvStore[key] = value;
  }),
  getMMKVString: jest.fn((key: string) => {
    const value = mmkvStore[key];
    return typeof value === "string" ? value : "";
  }),
  setMMKVString: jest.fn((key: string, value: string) => {
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

import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { RefreshControl, StyleSheet } from "react-native";
import RecentExpenses from "../../screens/RecentExpenses";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { fetchAndSetExpenses } from "../../components/ExpensesOutput/RecentExpensesUtil";
import { refreshWithToast } from "../../util/refreshWithToast";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertNoNestedVerticalFlatLists } from "../../test-utils/scroll-composition";

function expensesContextForList(
  listedExpenses: ReturnType<typeof makeExpense>[],
  options?: {
    tripExpenses?: ReturnType<typeof makeExpense>[];
  }
) {
  const tripExpenses = options?.tripExpenses ?? listedExpenses;
  return {
    expenses: tripExpenses,
    getRecentExpenses: () => listedExpenses,
    getDailyExpenses: jest.fn(() => []),
    loadExpensesFromStorage: jest.fn(async () => {}),
    deleteExpense: jest.fn(),
  };
}

const implicitDefaultTrip = {
  tripid: "t-implicit",
  tripName: "",
  tripCurrency: "EUR",
  isImplicitDefault: true,
  dailyBudget: "0",
  totalBudget: "0",
  travellers: ["Alice"],
};

function renderImplicitRecent(
  navigation: { navigate: jest.Mock },
  expenses: ReturnType<typeof expensesContextForList>
) {
  return renderWithAppProviders(
    <RecentExpenses navigation={navigation as any} />,
    {
      expenses,
      user: {
        periodName: "month",
        freshlyCreated: false,
      },
      trip: implicitDefaultTrip,
    }
  );
}

async function flushExpensesLoadTimeout() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

describe("RecentExpenses screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it("does not redirect to Profile or toast create-trip when leftover gate flag is set", async () => {
    const Toast = require("react-native-toast-message");
    const navigation = { navigate: jest.fn() };

    renderWithAppProviders(<RecentExpenses navigation={navigation as any} />, {
      expenses: expensesContextForList([]),
      user: {
        periodName: "month",
        freshlyCreated: true,
      },
      trip: {
        tripid: "t-implicit",
        tripName: "",
        tripCurrency: "EUR",
        isImplicitDefault: true,
        fetchAndSetTravellers: jest.fn(async () => {}),
      },
      network: { isConnected: true, strongConnection: true },
    });

    await waitFor(() => {
      expect(fetchAndSetExpenses).toHaveBeenCalled();
    });

    expect(navigation.navigate).not.toHaveBeenCalledWith("Profile");
    expect(Toast.show).not.toHaveBeenCalledWith(
      expect.objectContaining({
        text2: expect.any(String),
      })
    );
  });

  it("hides period progress on a budget-free implicit default Active trip", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderImplicitRecent(
      navigation,
      expensesContextForList([])
    );

    expect(screen.getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(screen.queryByTestId("expenses-summary-progress")).toBeNull();
  });

  it("keeps the add-expense entry point on Recent Expenses for an implicit default Active trip", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderImplicitRecent(
      navigation,
      expensesContextForList([])
    );

    expect(screen.getByTestId("add-expense-entry")).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalledWith("Profile");
  });

  it("shows a clear empty-state add-expense CTA for an implicit default Active trip", async () => {
    jest.useFakeTimers();
    const navigation = { navigate: jest.fn() };
    const screen = renderImplicitRecent(
      navigation,
      expensesContextForList([])
    );

    await flushExpensesLoadTimeout();

    expect(screen.getByTestId("empty-expenses-cta")).toBeTruthy();
    fireEvent.press(screen.getByText("Add Expense"));
    expect(navigation.navigate).toHaveBeenCalledWith("CategoryPick");
  });

  it("does not show the empty-state while the initial trip fetch is still running", async () => {
    jest.useFakeTimers();
    let resolveFetch!: () => void;
    const fetchPromise = new Promise<void>((resolve) => {
      resolveFetch = resolve;
    });
    (fetchAndSetExpenses as jest.Mock).mockImplementation(async () => {
      await fetchPromise;
    });

    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <RecentExpenses navigation={navigation as any} />,
      {
        expenses: expensesContextForList([]),
        user: {
          periodName: "month",
          freshlyCreated: false,
        },
        trip: implicitDefaultTrip,
        network: { isConnected: true, strongConnection: true },
      }
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByTestId("empty-expenses-cta")).toBeNull();
    expect(
      screen.queryByText(/No expenses in this time period yet/)
    ).toBeNull();

    await act(async () => {
      resolveFetch();
      await Promise.resolve();
    });

    await flushExpensesLoadTimeout();

    expect(screen.getByTestId("empty-expenses-cta")).toBeTruthy();
  });

  it("keeps the empty-state CTA visible during pull-to-refresh after an empty fetch this session", async () => {
    jest.useFakeTimers();
    let resolveRefresh!: () => void;
    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    (refreshWithToast as jest.Mock).mockImplementation(
      async ({
        setIsFetching,
      }: {
        setIsFetching: (value: boolean) => void;
      }) => {
        setIsFetching(true);
        await refreshPromise;
        setIsFetching(false);
      }
    );

    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <RecentExpenses navigation={navigation as any} />,
      {
        expenses: expensesContextForList([]),
        user: {
          periodName: "month",
          freshlyCreated: false,
        },
        trip: implicitDefaultTrip,
        network: { isConnected: true, strongConnection: true },
      }
    );

    await act(async () => {
      await Promise.resolve();
    });
    await flushExpensesLoadTimeout();
    expect(screen.getByTestId("empty-expenses-cta")).toBeTruthy();

    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => {
      refreshControl.props.onRefresh();
      await Promise.resolve();
    });

    expect(screen.getByTestId("empty-expenses-cta")).toBeTruthy();
    expect(
      screen.getByText(/No expenses in this time period yet/)
    ).toBeTruthy();

    await act(async () => {
      resolveRefresh();
      await Promise.resolve();
    });
  });

  it("does not show the empty-state CTA when the trip ledger already has expenses", async () => {
    jest.useFakeTimers();
    const historyExpense = makeExpense({
      id: "e-history",
      calcAmount: 40,
      amount: 40,
    });
    const navigation = { navigate: jest.fn() };
    const screen = renderImplicitRecent(
      navigation,
      expensesContextForList([], { tripExpenses: [historyExpense] })
    );

    await flushExpensesLoadTimeout();

    expect(screen.queryByTestId("empty-expenses-cta")).toBeNull();
  });

  it("shows the naming banner for an undismissed implicit default Active trip", async () => {
    jest.useFakeTimers();
    const navigation = { navigate: jest.fn() };
    const screen = renderImplicitRecent(
      navigation,
      expensesContextForList([])
    );

    await flushExpensesLoadTimeout();

    expect(screen.getByTestId("naming-banner")).toBeTruthy();
    expect(
      screen.getByText("Name your budget to keep things organized.")
    ).toBeTruthy();
    expect(screen.getByTestId("naming-banner-name-it")).toBeTruthy();
    expect(screen.getByTestId("naming-banner-later")).toBeTruthy();
  });

  it("Name it opens the promote Name your budget flow", async () => {
    jest.useFakeTimers();
    const navigation = { navigate: jest.fn() };
    const screen = renderImplicitRecent(
      navigation,
      expensesContextForList([])
    );

    await flushExpensesLoadTimeout();

    fireEvent.press(screen.getByText("Name it"));
    expect(navigation.navigate).toHaveBeenCalledWith("ManageTrip", {
      tripId: "t-implicit",
      mode: "promote",
    });
  });

  it("Later permanently dismisses the naming banner across remount", async () => {
    jest.useFakeTimers();
    const navigation = { navigate: jest.fn() };
    const screen = renderImplicitRecent(
      navigation,
      expensesContextForList([])
    );

    await flushExpensesLoadTimeout();

    fireEvent.press(screen.getByTestId("naming-banner-later"));
    expect(screen.queryByTestId("naming-banner")).toBeNull();
    expect(mmkvStore["namingBannerDismissed_t-implicit"]).toBe("1");

    screen.unmount();
    const remounted = renderImplicitRecent(
      { navigate: jest.fn() },
      expensesContextForList([])
    );
    await flushExpensesLoadTimeout();
    expect(remounted.queryByTestId("naming-banner")).toBeNull();
  });

  it("never shows the naming banner when the Active trip already has expenses", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderImplicitRecent(
      navigation,
      expensesContextForList([
        makeExpense({ id: "e1", calcAmount: 12, amount: 12 }),
      ])
    );

    expect(screen.queryByTestId("naming-banner")).toBeNull();
  });

  it("first expense permanently dismisses the naming banner in MMKV", async () => {
    jest.useFakeTimers();
    const navigation = { navigate: jest.fn() };
    renderImplicitRecent(
      navigation,
      expensesContextForList([
        makeExpense({ id: "e1", calcAmount: 12, amount: 12 }),
      ])
    );

    await act(async () => {});

    expect(mmkvStore["namingBannerDismissed_t-implicit"]).toBe("1");
  });

  it("does not show the naming banner on a named Active trip", async () => {
    jest.useFakeTimers();
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <RecentExpenses navigation={navigation as any} />,
      {
        expenses: expensesContextForList([]),
        user: {
          periodName: "month",
          freshlyCreated: false,
        },
        trip: {
          tripid: "t-named",
          tripName: "Japan 2026",
          tripCurrency: "EUR",
          isImplicitDefault: false,
          travellers: ["Alice"],
        },
      }
    );

    await flushExpensesLoadTimeout();

    expect(screen.queryByTestId("naming-banner")).toBeNull();
  });
});
