import React, { createContext, useEffect, useState } from "react";
import { loadSettings } from "../components/UI/SettingsSection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SplashScreenOverlay from "../components/UI/SplashScreenOverlay";

export const SettingsContext = createContext({
  settings: {},
  saveSettings: (settings: object): void => {
    return;
  },
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const loadSettingsAsync = async () => {
      const settingsString = await AsyncStorage.getItem("settings");
      if (settingsString) {
        const loadedSettings = JSON.parse(settingsString);
        setSettings(loadedSettings);
      } else
        setSettings({
          showFlags: false,
          showWhoPaid: false,
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
