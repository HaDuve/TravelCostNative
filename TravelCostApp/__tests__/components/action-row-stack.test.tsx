import * as React from "react";
import { Pressable, StyleSheet } from "react-native";
import { fireEvent } from "@testing-library/react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import ActionRowStack from "../../components/UI/ActionRowStack";
import { ActionRowTokens } from "../../styles/action-row-tokens";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("ActionRowStack", () => {
  it("spaces stacked rows for modal footers", () => {
    const screen = renderWithAppProviders(
      <ActionRowStack
        actions={[
          {
            testID: "stack-primary",
            tier: "primary",
            label: "Submit",
            onPress: jest.fn(),
          },
          {
            testID: "stack-cancel",
            tier: "secondary",
            label: "Cancel",
            onPress: jest.fn(),
          },
        ]}
      />,
      { wrapNavigation: false }
    );

    const stackStyle = StyleSheet.flatten(
      screen.getByTestId("action-row-stack").props.style
    ) as Record<string, unknown>;

    expect(stackStyle.gap).toBe(ActionRowTokens.marginBottom);
  });

  it("hides chevrons by default for form and modal commits", () => {
    const screen = renderWithAppProviders(
      <ActionRowStack
        actions={[
          {
            testID: "stack-no-chevron",
            label: "Confirm",
            onPress: jest.fn(),
          },
        ]}
      />,
      { wrapNavigation: false }
    );

    expect(screen.queryByText("›")).toBeNull();
  });

  it("does not fire disabled actions", () => {
    const onPress = jest.fn();
    const screen = renderWithAppProviders(
      <ActionRowStack
        actions={[
          {
            testID: "stack-disabled",
            tier: "primary",
            label: "Submit",
            onPress,
            disabled: true,
          },
        ]}
      />,
      { wrapNavigation: false }
    );

    const pressable = screen.getByTestId("stack-disabled");
    const rowStyle = StyleSheet.flatten(
      typeof pressable.props.style === "function"
        ? pressable.props.style({ pressed: false })
        : pressable.props.style
    ) as Record<string, unknown>;
    expect(rowStyle.opacity).toBe(0.5);

    fireEvent.press(pressable);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders duplicate labels when testIDs are omitted", () => {
    const firstPress = jest.fn();
    const secondPress = jest.fn();
    const screen = renderWithAppProviders(
      <ActionRowStack
        actions={[
          { label: "Cancel", onPress: firstPress },
          { label: "Cancel", onPress: secondPress },
        ]}
      />,
      { wrapNavigation: false }
    );

    const pressables = screen.UNSAFE_getAllByType(Pressable);
    expect(pressables).toHaveLength(2);

    fireEvent.press(pressables[0]);
    fireEvent.press(pressables[1]);
    expect(firstPress).toHaveBeenCalledTimes(1);
    expect(secondPress).toHaveBeenCalledTimes(1);
  });

  it("clears per-row bottom margin so stack gap controls spacing", () => {
    const screen = renderWithAppProviders(
      <ActionRowStack
        actions={[
          { testID: "stack-row-a", label: "First", onPress: jest.fn() },
          { testID: "stack-row-b", label: "Second", onPress: jest.fn() },
        ]}
      />,
      { wrapNavigation: false }
    );

    const pressables = screen.UNSAFE_getAllByType(Pressable);
    for (const pressable of pressables) {
      const rowStyle = StyleSheet.flatten(
        typeof pressable.props.style === "function"
          ? pressable.props.style({ pressed: false })
          : pressable.props.style
      ) as Record<string, unknown>;
      expect(rowStyle.marginBottom).toBeUndefined();
    }
  });
});
