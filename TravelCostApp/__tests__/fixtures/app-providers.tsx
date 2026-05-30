import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";

import { AuthContext } from "../../store/auth-context";
import { ExpensesContext } from "../../store/expenses-context";
import { NetworkContext } from "../../store/network-context";
import { OrientationContext } from "../../store/orientation-context";
import { SettingsContext } from "../../store/settings-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import { makeExpense } from "./expense";

export type AppProviderOverrides = {
  auth?: Record<string, unknown>;
  trip?: Record<string, unknown>;
  expenses?: Record<string, unknown>;
  user?: Record<string, unknown>;
  network?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  orientation?: Record<string, unknown>;
  wrapNavigation?: boolean;
};

const defaultTrip = {
  tripid: "t1",
  tripName: "Japan 2026",
  tripCurrency: "EUR",
  dailyBudget: "100",
  totalBudget: "3000",
  travellers: [
    { uid: "u1", userName: "Alice" },
    { uid: "u2", userName: "Bob" },
  ],
  loadTravellersFromStorage: jest.fn(async () => {}),
};

const defaultUser = {
  userName: "Alice",
  freshlyCreated: false,
  periodName: "month",
  lastCurrency: "EUR",
  setPeriodString: jest.fn(),
  isSendingOfflineQueueMutex: false,
  setIsSendingOfflineQueueMutex: jest.fn(),
};

const defaultExpenses = {
  expenses: [makeExpense({ id: "e1", calcAmount: 75 })],
  isSyncing: false,
  updateExpenseId: undefined,
  getRecentExpenses: () => [makeExpense({ id: "e1", calcAmount: 75 })],
  loadExpensesFromStorage: jest.fn(async () => {}),
};

const defaultSettings = {
  settings: {
    hideSpecialExpenses: false,
    showInternetSpeed: false,
    disableNumberAnimations: true,
    trafficLightBudgetColors: false,
  },
};

export function AppProviders({
  children,
  overrides = {},
}: {
  children: React.ReactNode;
  overrides?: AppProviderOverrides;
}) {
  const trip = { ...defaultTrip, ...overrides.trip };
  const user = { ...defaultUser, ...overrides.user };
  const expenses = { ...defaultExpenses, ...overrides.expenses };
  const settings = {
    settings: {
      ...defaultSettings.settings,
      ...(overrides.settings?.settings as object | undefined),
    },
  };
  const network = {
    isConnected: false,
    strongConnection: false,
    lastConnectionSpeedInMbps: 0,
    ...overrides.network,
  };
  const orientation = {
    isPortrait: true,
    isTablet: false,
    ...overrides.orientation,
  };
  const auth = { uid: "u1", ...overrides.auth };

  const tree = (
    <AuthContext.Provider value={auth as any}>
      <TripContext.Provider value={trip as any}>
        <ExpensesContext.Provider value={expenses as any}>
          <UserContext.Provider value={user as any}>
            <NetworkContext.Provider value={network as any}>
              <SettingsContext.Provider value={settings as any}>
                <OrientationContext.Provider value={orientation as any}>
                  {children}
                </OrientationContext.Provider>
              </SettingsContext.Provider>
            </NetworkContext.Provider>
          </UserContext.Provider>
        </ExpensesContext.Provider>
      </TripContext.Provider>
    </AuthContext.Provider>
  );

  if (overrides.wrapNavigation === false) {
    return tree;
  }

  return <NavigationContainer>{tree}</NavigationContainer>;
}

export function renderWithAppProviders(
  ui: React.ReactElement,
  overrides: AppProviderOverrides = {},
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AppProviders overrides={overrides}>{children}</AppProviders>
    ),
    ...options,
  });
}
