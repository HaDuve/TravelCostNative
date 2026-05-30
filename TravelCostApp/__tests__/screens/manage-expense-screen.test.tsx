import * as React from "react";
import { ScrollView } from "react-native";

jest.mock("../../components/ManageExpense/ExpenseForm", () => () => null);

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
  NotificationFeedbackType: { Success: "Success" },
}));

jest.mock("react-native-toast-message/lib/src/Toast", () => ({
  Toast: { show: jest.fn(), hide: jest.fn() },
}));

import ManageExpense from "../../screens/ManageExpense";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("ManageExpense screen", () => {
  it("delivers taps to controls while the keyboard is open", () => {
    const screen = renderWithAppProviders(
      <ManageExpense
        route={{ params: {} }}
        navigation={{ navigate: jest.fn(), pop: jest.fn(), popToTop: jest.fn() }}
      />,
      { wrapNavigation: false, expenses: { expenses: [] } }
    );

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.keyboardShouldPersistTaps).toBe("always");
  });
});
