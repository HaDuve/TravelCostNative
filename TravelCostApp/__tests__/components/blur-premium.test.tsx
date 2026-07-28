import * as React from "react";
import { StyleSheet } from "react-native";
import { waitFor } from "@testing-library/react-native";
import { Card } from "react-native-paper";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: object;
    }) => React.createElement(View, { testID: "blur-premium-overlay", style }, children),
  };
});

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => callback(), [callback]);
    },
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

jest.mock("../../components/Rating/firstStartUtil", () => ({
  shouldShowOnboarding: jest.fn(async () => false),
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../util/appState", () => ({
  sleep: jest.fn(async () => {}),
}));

import BlurPremium from "../../components/Premium/BlurPremium";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

describe("BlurPremium", () => {
  it("gives the paywall prompt card enough horizontal space for readable labels", async () => {
    const checkPremium = jest.fn(async () => false);

    const screen = renderWithAppProviders(<BlurPremium canBack />, {
      user: {
        checkPremium,
        isPremium: false,
        freshlyCreated: false,
      },
      network: {
        isConnected: true,
        strongConnection: true,
      },
    });

    await waitFor(() => {
      expect(checkPremium).toHaveBeenCalled();
    });

    expect(screen.getByText(i18n.t("paywallTitle"))).toBeTruthy();

    const overlay = screen.getByTestId("blur-premium-overlay");
    const overlayStyle = StyleSheet.flatten(
      overlay.props.style
    ) as Record<string, unknown>;
    expect(overlayStyle.flexDirection).not.toBe("row");
    expect(overlayStyle.paddingHorizontal).toBeDefined();

    const cardWrap = screen.getByTestId("blur-premium-card-wrap");
    const cardWrapStyle = StyleSheet.flatten(
      cardWrap.props.style
    ) as Record<string, unknown>;
    expect(cardWrapStyle.width).toBe("100%");
    expect(cardWrapStyle.maxWidth).toBeGreaterThanOrEqual(300);

    const card = screen.UNSAFE_getByType(Card);
    const cardStyle = StyleSheet.flatten(card.props.style) as Record<
      string,
      unknown
    >;
    expect(cardStyle.width).toBe("100%");
  });
});
