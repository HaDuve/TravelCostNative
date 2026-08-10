import * as React from "react";
import { fireEvent, within } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import SettingsSection from "../../components/UI/SettingsSection";
import { renderWithAppProviders } from "../fixtures/app-providers";

function switchForLabel(
  screen: ReturnType<typeof renderWithAppProviders>,
  label: string,
) {
  let node: { parent?: unknown } | null = screen.getByText(label);
  while (node) {
    try {
      return within(node as object).getByRole("switch");
    } catch {
      node = (node.parent as { parent?: unknown } | null) ?? null;
    }
  }
  throw new Error(`No switch found for label: ${label}`);
}

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
    expect(switchForLabel(screen, "Ask AI for good prices").props.value).toBe(
      false,
    );
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
