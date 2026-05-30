import * as React from "react";
import { Pressable, StyleSheet } from "react-native";

import ExpenseSwipeDeleteAction from "../../components/ExpensesOutput/ExpenseSwipeDeleteAction";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("ExpenseSwipeDeleteAction", () => {
  it("centers the delete icon within the red swipe action background", () => {
    const screen = renderWithAppProviders(
      <ExpenseSwipeDeleteAction onPress={jest.fn()} />,
      { wrapNavigation: false }
    );

    const container = screen.getByTestId("expense-swipe-delete-action");
    const containerStyle = StyleSheet.flatten(
      container.props.style
    ) as Record<string, unknown>;

    expect(containerStyle.alignItems).toBe("center");
    expect(containerStyle.justifyContent).toBe("center");
    expect(containerStyle.paddingLeft).toBeUndefined();
    expect(containerStyle.paddingTop).toBeUndefined();

    const button = container.findByType(Pressable);
    const rawButtonStyle = button.props.style;
    const buttonStyle = StyleSheet.flatten(
      typeof rawButtonStyle === "function"
        ? rawButtonStyle({ pressed: false })
        : rawButtonStyle
    ) as Record<string, unknown>;

    expect(buttonStyle.marginLeft).toBeUndefined();
    expect(buttonStyle.marginTop).toBeUndefined();
  });
});
