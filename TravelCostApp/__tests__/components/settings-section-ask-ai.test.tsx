import * as React from "react";
import { fireEvent } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import SettingsSection from "../../components/UI/SettingsSection";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("SettingsSection ask AI setting", () => {
  it("shows Ask AI for good prices switch when the setting is off", () => {
    const screen = renderWithAppProviders(
      <SettingsSection multiTraveller={false} />,
      {
        wrapNavigation: false,
        settings: {
          settings: { askAiForGoodPrices: false },
          saveSettings: jest.fn(async () => {}),
        },
      },
    );

    expect(screen.getByText("Ask AI for good prices")).toBeTruthy();
  });

  it("persists Ask AI for good prices when toggled on", () => {
    const saveSettings = jest.fn(async () => {});
    const screen = renderWithAppProviders(
      <SettingsSection multiTraveller={false} />,
      {
        wrapNavigation: false,
        settings: {
          settings: {
            askAiForGoodPrices: false,
            showFlags: true,
            showWhoPaid: true,
            alwaysShowAdvanced: false,
            skipCategoryScreen: false,
            showInternetSpeed: false,
            hideSpecialExpenses: false,
            disableNumberAnimations: false,
            trafficLightBudgetColors: true,
          },
          saveSettings,
        },
      },
    );

    fireEvent.press(screen.getByText("Ask AI for good prices"));

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ askAiForGoodPrices: true }),
    );
  });
});
