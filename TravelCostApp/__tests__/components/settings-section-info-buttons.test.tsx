import * as React from "react";
import { fireEvent } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import SettingsSection from "../../components/UI/SettingsSection";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

const SETTINGS_TOGGLE_INFO_KEYS = [
  "trafficLightBudgetColors",
  "hideSpecialExpenses",
  "disableNumberAnimations",
  "skipCategoryScreen",
  "alwaysShowAdvanced",
  "showFlags",
  "showInternetSpeed",
  "askAiForGoodPrices",
  "showWhoPaid",
] as const;

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

  it("explains hide special expenses when its info button is pressed", () => {
    const screen = renderWithAppProviders(
      <SettingsSection multiTraveller={false} />,
      { wrapNavigation: false },
    );

    fireEvent.press(screen.getByTestId("settings-info-hideSpecialExpenses"));

    expect(screen.getByText(i18n.t("hideSpecialExpensesInfoText"))).toBeTruthy();
    expect(screen.getByText(i18n.t("confirm"))).toBeTruthy();
  });
});
