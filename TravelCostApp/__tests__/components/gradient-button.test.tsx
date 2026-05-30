import * as React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import GradientButton from "../../components/UI/GradientButton";
import { renderWithAppProviders } from "../fixtures/app-providers";
import {
  assertSolidBackgroundForShadow,
  styleHasShadow,
} from "../../util/shadow-styles";

function flattenStyle(style: unknown): Record<string, unknown> {
  return StyleSheet.flatten(style as object) as Record<string, unknown>;
}

function isVisibleOpaqueBackground(backgroundColor: unknown): boolean {
  return (
    backgroundColor != null &&
    backgroundColor !== "transparent" &&
    backgroundColor !== ""
  );
}

describe("GradientButton", () => {
  it("keeps the outer layout wrapper free of chrome", () => {
    const screen = renderWithAppProviders(
      <GradientButton onPress={jest.fn()} style={{ marginHorizontal: "8%" }}>
        Save trip
      </GradientButton>,
      { wrapNavigation: false }
    );

    const outerStyle = flattenStyle(
      screen.getByTestId("gradient-button-layout").props.style
    );
    expect(isVisibleOpaqueBackground(outerStyle.backgroundColor)).toBe(false);
    expect(styleHasShadow(outerStyle)).toBe(false);
  });

  it("casts shadow from a rounded shell that matches the gradient pill", () => {
    const screen = renderWithAppProviders(
      <GradientButton onPress={jest.fn()}>Save trip</GradientButton>,
      { wrapNavigation: false }
    );

    const shadowStyle = flattenStyle(
      screen.getByTestId("gradient-button-shadow").props.style
    );
    assertSolidBackgroundForShadow(shadowStyle);
    expect(styleHasShadow(shadowStyle)).toBe(true);
    expect(shadowStyle.borderRadius).toBe(16);
    expect(shadowStyle.shadowOpacity).toBeLessThan(0.75);
  });

  it("uses the last gradient stop as the shadow shell background", () => {
    const colors = ["#FEEF60", "#FBF0A8", "#A1D8C1"];

    const screen = renderWithAppProviders(
      <GradientButton onPress={jest.fn()} colors={colors}>
        Local price
      </GradientButton>,
      { wrapNavigation: false }
    );

    const shadowStyle = flattenStyle(
      screen.getByTestId("gradient-button-shadow").props.style
    );
    expect(shadowStyle.backgroundColor).toBe("#A1D8C1");
  });

  it("fills the shadow shell with gradient only, without its own shadow or inset", () => {
    const screen = renderWithAppProviders(
      <GradientButton onPress={jest.fn()}>Save trip</GradientButton>,
      { wrapNavigation: false }
    );

    const gradient = screen.UNSAFE_getByType(LinearGradient);
    const gradientStyle = flattenStyle(gradient.props.style);
    expect(styleHasShadow(gradientStyle)).toBe(false);
    expect(isVisibleOpaqueBackground(gradientStyle.backgroundColor)).toBe(
      false
    );
    expect(gradientStyle.marginHorizontal).toBeUndefined();
    expect(gradientStyle.borderRadius).toBe(16);
  });
});
