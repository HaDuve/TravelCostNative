import * as React from "react";
import { StyleSheet } from "react-native";
import { waitFor } from "@testing-library/react-native";

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
    }) => React.createElement(View, { style }, children),
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
import { blurPremiumLayoutStyles } from "../../styles/blur-premium-layout";
import { dynamicScale } from "../../util/scalingUtil";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

describe("blur premium layout styles", () => {
  it("uses column flex and horizontal inset on the overlay", () => {
    const flat = StyleSheet.flatten(
      blurPremiumLayoutStyles.titleContainerBlur
    ) as Record<string, unknown>;

    expect(flat.flexDirection).toBe("column");
    expect(flat.paddingHorizontal).toBe("5%");
  });

  it("gives the card wrapper full width with a scaled max width", () => {
    const flat = StyleSheet.flatten(
      blurPremiumLayoutStyles.overlayCardWrap
    ) as Record<string, unknown>;

    expect(flat.width).toBe("100%");
    expect(flat.maxWidth).toBe(dynamicScale(420, false, 0.5));
  });

  it("stretches the card to the wrapper width", () => {
    const flat = StyleSheet.flatten(
      blurPremiumLayoutStyles.overlayCard
    ) as Record<string, unknown>;

    expect(flat.width).toBe("100%");
  });
});

describe("BlurPremium", () => {
  it("renders the paywall prompt for non-premium users", async () => {
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
    expect(screen.getByText(i18n.t("back"))).toBeTruthy();
  });

  it("shows a feature hint under the premium prompt when featureHintKey is set", async () => {
    const checkPremium = jest.fn(async () => false);

    const screen = renderWithAppProviders(
      <BlurPremium featureHintKey="paywallHintCustomCategories" />,
      {
        user: {
          checkPremium,
          isPremium: false,
          freshlyCreated: false,
        },
        network: {
          isConnected: true,
          strongConnection: true,
        },
      }
    );

    await waitFor(() => {
      expect(checkPremium).toHaveBeenCalled();
    });

    expect(screen.getByText(i18n.t("paywallTitle"))).toBeTruthy();
    expect(
      screen.getByText("Create your own categories")
    ).toBeTruthy();
  });
});
