import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

import AddExpensesHereButton from "../../components/UI/AddExpensesHereButton";
import LayoutContextProvider from "../../store/layout-context";
import { renderWithAppProviders } from "../fixtures/app-providers";

function renderAddExpenseHereAt(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 3,
    fontScale: 1,
  });

  return renderWithAppProviders(
    <LayoutContextProvider>
      <AddExpensesHereButton dayISO="2026-01-15" />
    </LayoutContextProvider>,
    { wrapNavigation: false }
  );
}

describe("AddExpensesHereButton layout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps add-expense-here full width on narrow phones", () => {
    const screen = renderAddExpenseHereAt(390, 844);
    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("add-expense-here-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.width).toBe("100%");
    expect(frameStyle.alignSelf).toBe("stretch");
    expect(frameStyle.maxWidth).toBeUndefined();
  });

  it("constrains add-expense-here on wide viewports", () => {
    const screen = renderAddExpenseHereAt(1024, 768);
    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("add-expense-here-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.maxWidth).toBe(480);
    expect(frameStyle.alignSelf).toBe("center");
    expect(frameStyle.minHeight).toBe(44);
    expect(frameStyle.minWidth).toBe(44);
  });
});
