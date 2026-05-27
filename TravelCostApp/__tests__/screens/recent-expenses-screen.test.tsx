import * as React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useScrollToTop: jest.fn() };
});

import { NavigationContainer } from "@react-navigation/native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
  identifyUser: jest.fn(async () => {}),
  initializeVexo: jest.fn(async () => true),
  VexoUserContext: {},
}));

jest.mock("../../components/ExpensesOutput/ExpensesOutput", () => ({
  MemoizedExpensesOutput: () => null,
}));

jest.mock("../../components/ExpensesOutput/ExpensesSummary", () => () => null);
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

import { AuthContext } from "../../store/auth-context";
import { ExpensesContext } from "../../store/expenses-context";
import { NetworkContext } from "../../store/network-context";
import { OrientationContext } from "../../store/orientation-context";
import { SettingsContext } from "../../store/settings-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";

function renderRecentExpenses() {
  const navigation = { navigate: jest.fn() };
  const RecentExpenses = require("../../screens/RecentExpenses").default;

  return render(
    <AuthContext.Provider value={{ uid: "u1" } as any}>
      <TripContext.Provider
        value={{
          tripid: "t1",
          tripName: "Japan 2026",
          loadTravellersFromStorage: jest.fn(async () => {}),
        } as any}
      >
        <ExpensesContext.Provider
          value={{
            // Non-empty so the initial "load once" effect doesn't trigger state updates in tests
            expenses: [{ id: "e1" }],
            isSyncing: false,
            updateExpenseId: undefined,
            getRecentExpenses: () => [],
            loadExpensesFromStorage: jest.fn(async () => {}),
          } as any}
        >
          <UserContext.Provider
            value={{
              freshlyCreated: false,
              periodName: "month",
              setPeriodString: jest.fn(),
              isSendingOfflineQueueMutex: false,
              setIsSendingOfflineQueueMutex: jest.fn(),
            } as any}
          >
            <NetworkContext.Provider
              value={{
                isConnected: false,
                strongConnection: false,
                lastConnectionSpeedInMbps: 0,
              } as any}
            >
              <SettingsContext.Provider value={{ settings: { showInternetSpeed: false } } as any}>
                <OrientationContext.Provider value={{ isPortrait: true, isTablet: false } as any}>
                  <NavigationContainer>
                    <RecentExpenses navigation={navigation as any} />
                  </NavigationContainer>
                </OrientationContext.Provider>
              </SettingsContext.Provider>
            </NetworkContext.Provider>
          </UserContext.Provider>
        </ExpensesContext.Provider>
      </TripContext.Provider>
    </AuthContext.Provider>
  );
}

describe("RecentExpenses screen", () => {
  it("shows the trip name in the header", () => {
    const screen = renderRecentExpenses();
    expect(screen.getByText(/Japan 2026/)).toBeTruthy();
  });
});

