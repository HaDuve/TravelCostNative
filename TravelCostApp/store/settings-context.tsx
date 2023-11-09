import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SplashScreenOverlay from "../components/UI/SplashScreenOverlay";
import PropTypes from "prop-types";
import { secureStoreGetItem, secureStoreSetItem } from "./secure-storage";
import safeLogError from "../util/error";

export interface Settings {
  showFlags: boolean;
  showWhoPaid: boolean;
  alwaysShowAdvanced: boolean;
  skipCategoryScreen: boolean;
  showInternetSpeed: boolean;
  hideSpecialExpenses: boolean;
}

export const SettingsContext = createContext({
  settings: {} as Settings,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  saveSettings: async (settings: Settings): Promise<void> => {},
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(null);

  useEffect(() => {
    const loadSettingsAsync = async () => {
      const settingsString = await secureStoreGetItem("settings");
      if (settingsString) {
        const loadedSettings: Settings = JSON.parse(settingsString);
        setSettings(loadedSettings);
      } else
        setSettings({
          showFlags: true,
          showWhoPaid: true,
          alwaysShowAdvanced: true,
          skipCategoryScreen: true,
          showInternetSpeed: true,
          hideSpecialExpenses: true,
        });
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
