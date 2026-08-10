import * as React from "react";
import { useContext, useEffect } from "react";
import { render, waitFor } from "@testing-library/react-native";

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(),
  secureStoreSetItem: jest.fn(),
}));

import { secureStoreGetItem } from "../../store/secure-storage";
import {
  SettingsContext,
  SettingsProvider,
} from "../../store/settings-context";

describe("SettingsProvider", () => {
  it("fills missing askAiForGoodPrices from defaults when loading stored settings", async () => {
    jest.mocked(secureStoreGetItem).mockResolvedValue(
      JSON.stringify({
        showFlags: false,
        showWhoPaid: true,
        alwaysShowAdvanced: true,
        skipCategoryScreen: false,
        showInternetSpeed: true,
        hideSpecialExpenses: false,
        disableNumberAnimations: true,
        trafficLightBudgetColors: false,
      }),
    );

    let loadedSettings: ReturnType<
      typeof useContext<typeof SettingsContext>
    >["settings"] | undefined;

    function Probe() {
      const { settings } = useContext(SettingsContext);
      useEffect(() => {
        loadedSettings = settings;
      }, [settings]);
      return null;
    }

    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(loadedSettings?.showFlags).toBe(false);
    });
    expect(loadedSettings?.askAiForGoodPrices).toBe(false);
    expect(loadedSettings?.alwaysShowAdvanced).toBe(true);
  });
});
