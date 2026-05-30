import * as React from "react";
import { StyleSheet } from "react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light", Heavy: "Heavy" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("rn-tourguide", () => ({
  TourGuideZone: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

import AddExpenseButton from "../../components/ManageExpense/AddExpenseButton";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertSolidBackgroundForShadow } from "../../util/shadow-styles";

describe("AddExpenseButton", () => {
  it("co-locates shadow and backgroundColor on the add expense fab", () => {
    const navigation = { navigate: jest.fn() };

    const screen = renderWithAppProviders(
      <AddExpenseButton navigation={navigation} />,
      { wrapNavigation: false }
    );

    const fab = screen.getByTestId("add-expense-fab");
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(fab.props.style) as Record<string, unknown>
    );
  });
});
