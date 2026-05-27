import * as React from "react";
import { render } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../util/http", () => ({
  fetchChangelog: jest.fn(async () => null),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import ProfileForm from "../../components/ManageProfile/ProfileForm";
import { AuthContext } from "../../store/auth-context";
import { ExpensesContext } from "../../store/expenses-context";
import { NetworkContext } from "../../store/network-context";
import { OrientationContext } from "../../store/orientation-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";

function renderProfileForm() {
  const navigation = { navigate: jest.fn() };

  return render(
    <AuthContext.Provider value={{ uid: "u1", logout: jest.fn() } as any}>
      <TripContext.Provider value={{ tripid: "t1", setCurrentTrip: jest.fn(async () => {}) } as any}>
        <ExpensesContext.Provider value={{ setExpenses: jest.fn() } as any}>
          <UserContext.Provider
            value={{
              userName: "Alice",
              freshlyCreated: false,
              hasNewChanges: false,
              setHasNewChanges: jest.fn(),
              setUserName: jest.fn(async () => {}),
              setTripHistory: jest.fn(),
            } as any}
          >
            <NetworkContext.Provider
              value={{
                isConnected: false,
                strongConnection: false,
              } as any}
            >
              <OrientationContext.Provider value={{ isPortrait: true } as any}>
                <ProfileForm
                  navigation={navigation as any}
                  setIsFetchingLogout={jest.fn()}
                />
              </OrientationContext.Provider>
            </NetworkContext.Provider>
          </UserContext.Provider>
        </ExpensesContext.Provider>
      </TripContext.Provider>
    </AuthContext.Provider>
  );
}

describe("Profile", () => {
  it("shows the signed-in User name", () => {
    const screen = renderProfileForm();
    expect(screen.getByText("Alice")).toBeTruthy();
  });
});
