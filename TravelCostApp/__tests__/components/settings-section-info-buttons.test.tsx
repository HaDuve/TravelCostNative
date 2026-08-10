import * as React from "react";
import { fireEvent } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import SettingsSection, {
  SETTINGS_TOGGLE_INFO_KEYS,
} from "../../components/UI/SettingsSection";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

describe("SettingsSection toggle info buttons", () => {
  it("shows an info button for every settings toggle", () => {
    const screen = renderWithAppProviders(
      <SettingsSection multiTraveller={true} />,
      { wrapNavigation: false },
    );

    for (const key of SETTINGS_TOGGLE_INFO_KEYS) {
      expect(screen.getByTestId(`settings-info-${key}`)).toBeTruthy();
    }
  });

  it("does not change settings when an info button is pressed", () => {
    const saveSettings = jest.fn(async () => {});
    const screen = renderWithAppProviders(
      <SettingsSection multiTraveller={false} />,
      {
        wrapNavigation: false,
        settings: {
          settings: { hideSpecialExpenses: false },
          saveSettings,
        },
      },
    );

    fireEvent.press(screen.getByTestId("settings-info-hideSpecialExpenses"));

    expect(saveSettings).not.toHaveBeenCalled();
  });

  it("labels each info button for assistive tech", () => {
    const screen = renderWithAppProviders(
      <SettingsSection multiTraveller={false} />,
      { wrapNavigation: false },
    );

    const infoButton = screen.getByTestId("settings-info-hideSpecialExpenses");
    expect(infoButton.props.accessibilityLabel).toBe(
      i18n.t("settingsInfoButtonA11y", {
        setting: i18n.t("hideSpecialExpensesInfoTitle"),
      }),
    );
  });

  it("explains hide special expenses when its info button is pressed", () => {
    const screen = renderWithAppProviders(
      <SettingsSection multiTraveller={false} />,
      { wrapNavigation: false },
    );

    fireEvent.press(screen.getByTestId("settings-info-hideSpecialExpenses"));

    expect(screen.getByText(i18n.t("hideSpecialExpensesInfoText"))).toBeTruthy();
    expect(screen.getByText(i18n.t("confirm"))).toBeTruthy();
  });

  it("explains traffic light budget colors when its info button is pressed", () => {
    const screen = renderWithAppProviders(
      <SettingsSection multiTraveller={false} />,
      { wrapNavigation: false },
    );

    fireEvent.press(
      screen.getByTestId("settings-info-trafficLightBudgetColors"),
    );

    expect(screen.getByText(i18n.t("trafficLightInfoText"))).toBeTruthy();
  });

  it("mentions profile and expense form for ask AI info copy", () => {
    const text = i18n.t("askAiForGoodPricesInfoText").toLowerCase();
    expect(text).toMatch(/profile/);
    expect(text).toMatch(/expense/);
  });
});
