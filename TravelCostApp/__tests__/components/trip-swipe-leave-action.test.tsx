import * as React from "react";
import { Pressable, StyleSheet } from "react-native";

import TripSwipeLeaveAction from "../../components/ProfileOutput/TripSwipeLeaveAction";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { GlobalStyles } from "../../constants/styles";

describe("TripSwipeLeaveAction", () => {
  it("centers the exit-door icon within the red swipe action background", () => {
    const screen = renderWithAppProviders(
      <TripSwipeLeaveAction onPress={jest.fn()} />,
      { wrapNavigation: false }
    );

    const container = screen.getByTestId("trip-swipe-leave-action");
    const containerStyle = StyleSheet.flatten(
      container.props.style
    ) as Record<string, unknown>;

    expect(containerStyle.alignItems).toBe("center");
    expect(containerStyle.justifyContent).toBe("center");
    expect(containerStyle.backgroundColor).toBe(GlobalStyles.colors.error500);
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
