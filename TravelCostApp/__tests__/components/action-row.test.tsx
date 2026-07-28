import * as React from "react";
import { Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import ActionRow from "../../components/UI/ActionRow";
import { GlobalStyles } from "../../constants/styles";
import { ActionRowTokens } from "../../styles/action-row-tokens";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { renderWithAppProviders } from "../fixtures/app-providers";

function getPressedPressableStyle(
  screen: ReturnType<typeof renderWithAppProviders>
) {
  const pressable = screen.UNSAFE_getByType(Pressable);
  const rawStyle = pressable.props.style;
  return StyleSheet.flatten(
    typeof rawStyle === "function" ? rawStyle({ pressed: true }) : rawStyle
  ) as Record<string, unknown>;
}

describe("ActionRow", () => {
  it("renders a gradient accent strip for primary tier", () => {
    const screen = renderWithAppProviders(
      <ActionRow
        testID="action-row-primary"
        tier="primary"
        label="Add another budget"
        hint="Starts empty"
        icon="add-circle-outline"
        onPress={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    const gradients = screen.UNSAFE_queryAllByType(LinearGradient);
    expect(gradients.length).toBe(1);
    expect(gradients[0].props.colors).toEqual(
      ActionRowTokens.gradients.primary
    );
  });

  it("renders no accent strip for secondary tier", () => {
    const screen = renderWithAppProviders(
      <ActionRow
        testID="action-row-secondary"
        tier="secondary"
        label="Join budget"
        icon="people-outline"
        onPress={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    expect(screen.UNSAFE_queryAllByType(LinearGradient)).toHaveLength(0);
  });

  it("applies subtle pressed scale matching trip list items", () => {
    const screen = renderWithAppProviders(
      <ActionRow
        testID="action-row-pressed"
        label="Feedback"
        onPress={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    const pressedStyle = getPressedPressableStyle(screen);
    expect(pressedStyle.transform).toEqual(
      GlobalStyles.pressedActionRow.transform
    );
    expect(pressedStyle.opacity).toBe(GlobalStyles.pressedActionRow.opacity);
  });

  it("co-locates shadow, border, and background on the row shell", () => {
    const screen = renderWithAppProviders(
      <ActionRow
        testID="action-row-shadow"
        label="Local Price"
        onPress={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    const pressable = screen.getByTestId("action-row-shadow");
    const rawStyle = pressable.props.style;
    const rowStyle = StyleSheet.flatten(
      typeof rawStyle === "function" ? rawStyle({ pressed: false }) : rawStyle
    ) as Record<string, unknown>;
    const cardStyle = StyleSheet.flatten(
      shadowRegressionStyles.actionRowCard
    ) as Record<string, unknown>;

    expect(rowStyle.backgroundColor).toBe(cardStyle.backgroundColor);
    expect(rowStyle.borderWidth).toBe(cardStyle.borderWidth);
    expect(rowStyle.borderColor).toBe(cardStyle.borderColor);
    expect(rowStyle.shadowOpacity).toBe(cardStyle.shadowOpacity);
  });

  it("uses a white surface that contrasts the page background", () => {
    const cardStyle = StyleSheet.flatten(
      shadowRegressionStyles.actionRowCard
    ) as Record<string, unknown>;

    expect(cardStyle.backgroundColor).toBe(ActionRowTokens.surface);
    expect(cardStyle.backgroundColor).not.toBe(
      GlobalStyles.colors.backgroundColor
    );
  });
});
