import * as React from "react";

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
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("Profile", () => {
  it("shows the signed-in User name", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileForm
        navigation={navigation as any}
        setIsFetchingLogout={jest.fn()}
      />,
      {
        wrapNavigation: false,
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}) },
        expenses: { setExpenses: jest.fn() },
        user: {
          userName: "Alice",
          hasNewChanges: false,
          setHasNewChanges: jest.fn(),
          setUserName: jest.fn(async () => {}),
          setTripHistory: jest.fn(),
        },
      }
    );

    expect(screen.getByText("Alice")).toBeTruthy();
  });
});
