import * as React from "react";
import { render } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";

import OverviewScreen from "../../screens/OverviewScreen";

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

import { AuthContext } from "../../store/auth-context";
import { ExpensesContext } from "../../store/expenses-context";
import { NetworkContext } from "../../store/network-context";
import { OrientationContext } from "../../store/orientation-context";
import { SettingsContext } from "../../store/settings-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";

function renderOverview() {
  const navigation = { navigate: jest.fn() };

  return render(
    <AuthContext.Provider value={{ uid: "u1" } as any}>
      <TripContext.Provider value={{ tripid: "t1", tripName: "Japan 2026" } as any}>
        <ExpensesContext.Provider value={{ expenses: [], getRecentExpenses: () => [] } as any}>
          <UserContext.Provider
            value={{
              freshlyCreated: false,
              needsTour: false,
              periodName: "month",
              isShowingGraph: false,
              setIsShowingGraph: jest.fn(),
              setPeriodString: jest.fn(),
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
                    <OverviewScreen navigation={navigation as any} />
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

describe("Overview screen", () => {
  it("shows the trip name in the header", () => {
    const screen = renderOverview();
    expect(screen.getByText(/Japan 2026/)).toBeTruthy();
  });
});

