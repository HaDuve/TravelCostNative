import React, { createContext, useEffect, useState } from "react";
import SplashScreenOverlay from "../components/UI/SplashScreenOverlay";
import PropTypes from "prop-types";
import { secureStoreGetItem, secureStoreSetItem } from "./secure-storage";
import safeLogError from "../util/error";
import { safelyParseJSON } from "../util/jsonParse";

export interface Settings {
  showFlags: boolean;
  showWhoPaid: boolean;
  alwaysShowAdvanced: boolean;
  skipCategoryScreen: boolean;
  showInternetSpeed: boolean;
  hideSpecialExpenses: boolean;
  disableNumberAnimations: boolean;
  trafficLightBudgetColors: boolean;
}

export type SettingsContextType = {
  settings: Settings;
  saveSettings: (settings: Settings) => Promise<void>;
};

const defaultSettings: Settings = {
  showFlags: true,
  showWhoPaid: true,
  alwaysShowAdvanced: false,
  skipCategoryScreen: false,
  showInternetSpeed: false,
  hideSpecialExpenses: false,
  disableNumberAnimations: false,
  trafficLightBudgetColors: true,
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  saveSettings: async (_settings: Settings): Promise<void> => {
    return Promise.resolve();
  },
});

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loadSettingsAsync = async () => {
      const settingsString = await secureStoreGetItem("settings");
      if (settingsString) {
        const loadedSettings: Settings = safelyParseJSON(settingsString);
        loadedSettings && setSettings(loadedSettings);
      } else setSettings(defaultSettings);
    };
    loadSettingsAsync();
  }, []);

  const saveSettings = async (newSettings) => {
    try {
      const settingsString = JSON.stringify(newSettings);
      await secureStoreSetItem("settings", settingsString);
      setSettings(newSettings);
    } catch (error) {
      safeLogError(error);
    }
  };

  const value = {
    settings: settings,
    saveSettings: saveSettings,
  };
  if (settings === null) {
    // show loading indicator or placeholder content while settings are being loaded
    return <SplashScreenOverlay></SplashScreenOverlay>;
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

SettingsProvider.propTypes = { children: PropTypes.node.isRequired };
