import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SplashScreenOverlay from "../components/UI/SplashScreenOverlay";
import PropTypes from "prop-types";

export interface Settings {
  showFlags: boolean;
  showWhoPaid: boolean;
  alwaysShowAdvanced: boolean;
  skipCategoryScreen: boolean;
  showInternetSpeed: boolean;
}

export const SettingsContext = createContext({
  settings: {} as Settings,
  saveSettings: (settings: Settings): void => {
    // saving settings
    console.log(settings);
    return;
  },
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(null);

  useEffect(() => {
    const loadSettingsAsync = async () => {
      const settingsString = await AsyncStorage.getItem("settings");
      if (settingsString) {
        const loadedSettings: Settings = JSON.parse(settingsString);
        setSettings(loadedSettings);
      } else
        setSettings({
          showFlags: false,
          showWhoPaid: false,
          alwaysShowAdvanced: false,
          skipCategoryScreen: false,
          showInternetSpeed: false,
        });
    };
    loadSettingsAsync();
  }, []);

  const saveSettings = async (newSettings) => {
    try {
      const settingsString = JSON.stringify(newSettings);
      await AsyncStorage.setItem("settings", settingsString);
      setSettings(newSettings);
    } catch (error) {
      console.log(error);
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
