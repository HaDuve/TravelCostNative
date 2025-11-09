import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Theme, ThemeMode, ThemeName, getTheme } from "../constants/themes";
import { secureStoreGetItem, secureStoreSetItem } from "./secure-storage";
import safeLogError from "../util/error";
import { safelyParseJSON } from "../util/jsonParse";
import SplashScreenOverlay from "../components/UI/SplashScreenOverlay";
import PropTypes from "prop-types";

export interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const defaultThemeMode: ThemeMode = "auto";

const ThemeContext = createContext<ThemeContextType>({
  theme: getTheme("light"),
  themeMode: defaultThemeMode,
  isDark: false,
  setThemeMode: async (_mode: ThemeMode): Promise<void> => {
    return Promise.resolve();
  },
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

/**
 * Hook to get theme-aware GlobalStyles
 * Usage: const styles = useGlobalStyles();
 */
export const useGlobalStyles = () => {
  const { theme } = useTheme();
  // Import getGlobalStyles dynamically to avoid circular dependency
  const { getGlobalStyles } = require("../constants/styles");
  return getGlobalStyles(theme);
};

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultThemeMode);
  const [isLoading, setIsLoading] = useState(true);

  // Determine the actual theme to use
  const getEffectiveTheme = (): ThemeName => {
    if (themeMode === "auto") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return themeMode;
  };

  const effectiveTheme = getEffectiveTheme();
  const theme = getTheme(effectiveTheme);
  const isDark = effectiveTheme === "dark";

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedThemeMode = await secureStoreGetItem("themeMode");
        if (storedThemeMode) {
          const parsedMode = safelyParseJSON(storedThemeMode) as ThemeMode;
          if (parsedMode && ["light", "dark", "auto"].includes(parsedMode)) {
            setThemeModeState(parsedMode);
          }
        }
      } catch (error) {
        safeLogError(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await secureStoreSetItem("themeMode", JSON.stringify(mode));
      setThemeModeState(mode);
    } catch (error) {
      safeLogError(error);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
  };

  if (isLoading) {
    return <SplashScreenOverlay />;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = { children: PropTypes.node.isRequired };

