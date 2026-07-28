import * as React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../util/http", () => ({
  fetchChangelog: jest.fn(async () => null),
}));

jest.mock("../../store/async-storage", () => ({
  asyncStoreSafeClear: jest.fn(async () => {}),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import ProfileForm from "../../components/ManageProfile/ProfileForm";
import { i18n } from "../../i18n/i18n";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { asyncStoreSafeClear } from "../../store/async-storage";

describe("Profile", () => {
  let alertSpy: jest.SpyInstance;

  afterEach(() => {
    alertSpy?.mockRestore();
  });

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

  it("signs the User out when they confirm logout", async () => {
    const logout = jest.fn();
    const setCurrentTrip = jest.fn(async () => {});
    const setExpenses = jest.fn();
    const setTripHistory = jest.fn();
    const setUserName = jest.fn(async () => {});
    const setIsFetchingLogout = jest.fn();
    alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const yesButton = buttons?.find(
          (button) => button.text === i18n.t("yes")
        );
        yesButton?.onPress?.();
      });

    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileForm
        navigation={navigation as any}
        setIsFetchingLogout={setIsFetchingLogout}
      />,
      {
        wrapNavigation: false,
        auth: { uid: "u1", logout },
        trip: { tripid: "t1", setCurrentTrip },
        expenses: { setExpenses },
        user: {
          userName: "Alice",
          hasNewChanges: false,
          setHasNewChanges: jest.fn(),
          setUserName,
          setTripHistory,
        },
      }
    );

    fireEvent.press(screen.getByTestId("icon-exit-outline"));

    await waitFor(() => {
      expect(logout).toHaveBeenCalledWith("t1");
    });
    expect(setCurrentTrip).toHaveBeenCalledWith("reset", null);
    expect(setExpenses).toHaveBeenCalledWith([]);
    expect(setTripHistory).toHaveBeenCalledWith([]);
    expect(setUserName).toHaveBeenCalledWith("");
    expect(asyncStoreSafeClear).toHaveBeenCalled();
    expect(setIsFetchingLogout).toHaveBeenCalledWith(true);
    expect(setIsFetchingLogout).toHaveBeenCalledWith(false);
  });

  it("does not sign the User out when they dismiss logout", () => {
    const logout = jest.fn();
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileForm
        navigation={navigation as any}
        setIsFetchingLogout={jest.fn()}
      />,
      {
        wrapNavigation: false,
        auth: { uid: "u1", logout },
        trip: { tripid: "t1", setCurrentTrip: jest.fn(async () => {}) },
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

    fireEvent.press(screen.getByTestId("icon-exit-outline"));

    expect(alertSpy).toHaveBeenCalledWith(
      i18n.t("sure"),
      i18n.t("signOutAlertMess"),
      expect.any(Array)
    );
    expect(logout).not.toHaveBeenCalled();
  });
});
