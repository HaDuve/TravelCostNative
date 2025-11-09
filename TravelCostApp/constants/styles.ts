import { Platform, StyleSheet } from "react-native";
import { Layout } from "react-native-reanimated";
import {
  constantScale,
  dynamicScale,
  verticalScale,
} from "../util/scalingUtil";
import { Theme, lightTheme, darkTheme } from "./themes";

/**
 * Get GlobalStyles based on a theme
 * This function generates theme-aware styles
 */
export function getGlobalStyles(theme: Theme) {
  const colors = theme.colors;
  const isDark = theme === darkTheme;

  return {
    colors: colors,
    gradientColors: theme.gradientColors,
    gradientPrimaryButton: theme.gradientPrimaryButton,
    gradientColorsButton: theme.gradientColorsButton,
    gradientErrorButton: theme.gradientErrorButton,
    gradientAccentButton: theme.gradientAccentButton,
    tabBarColors: theme.tabBarColors,
    buttonTextPrimary: {
      color: "#FFFFFF",
      textAlign: "center" as const,
      fontStyle: "italic" as const,
      fontWeight: "300" as const,
      fontSize: dynamicScale(14, false, 0.5),
    },
    backButton: {
      flex: 1,
      padding: dynamicScale(8, false, 0.5),
      marginBottom: dynamicScale(-12, false, 0.5),
    },
    row: { flexDirection: "row" as const },
    titleText: {
      color: colors.textColor,
      fontSize: constantScale(28, 0.5),
      fontWeight: "bold" as const,
      marginBottom: dynamicScale(12, true, 0.1),
    },
    buttonTextGradient: {
      color: "#FFFFFF",
      textAlign: "center" as const,
      fontStyle: "italic" as const,
      fontWeight: "300" as const,
      fontSize: dynamicScale(14, false, 0.5),
    },
    buttonTextFlat: {
      color: colors.primary400,
      textAlign: "center" as const,
      fontStyle: "italic" as const,
      fontWeight: "300" as const,
      fontSize: dynamicScale(14, false, 0.5),
    },
    secondaryText: {
      fontSize: dynamicScale(14, false, 0.5),
      color: colors.gray700,
      fontWeight: "300" as const,
    },
    shadow: {
      elevation: 4,
      shadowColor: isDark ? "rgba(0, 0, 0, 0.5)" : "#BFBFBF",
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: isDark ? 0.5 : 0.75,
      shadowRadius: 1.3,
    },
    strongShadow: {
      elevation: 5,
      shadowColor: isDark ? "rgba(0, 0, 0, 0.8)" : "#002A22",
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: isDark ? 0.6 : 0.3,
      shadowRadius: 1.3,
    },
    wideStrongShadow: {
      ...Platform.select({
        ios: {
          shadowColor: isDark ? "rgba(0, 0, 0, 0.8)" : "#002A22",
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: isDark ? 0.6 : 0.4,
          shadowRadius: 3.3,
        },
        android: {
          elevation: 10,
          shadowColor: "rgba(0, 0, 0, 1)",
        },
      }),
    },
    shadowPrimary: {
      elevation: 4,
      borderColor: colors.primary500,
      shadowColor: colors.primary500,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.75,
    },
    shadowGlowPrimary: {
      elevation: 10,
      shadowColor: colors.primary800,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 3.8,
    },
    pressedWithShadow: {
      elevation: 0,
      transform: [{ scale: 0.9 }],
      shadowOpacity: 0.12,
      shadowOffset: { width: 1, height: 1 },
      shadowRadius: 1,
      opacity: 0.9,
    },
    pressedWithShadowNoScale: {
      elevation: 0,
      transform: [{ scale: 0.99 }],
      shadowOpacity: 0.12,
      shadowOffset: { width: 1, height: 1 },
      shadowRadius: 1,
      opacity: 0.99,
    },
    pressed: {
      elevation: 0,
      transform: [{ scale: 0.9 }],
      opacity: 0.9,
    },
    countryFlagStyle: {
      width: dynamicScale(30, false, 0.5),
      height: dynamicScale(25, false, 0.5),
      borderRadius: 1000,
      borderWidth: 1,
      borderColor: colors.gray700,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    countryFlagStyleBig: {
      width: dynamicScale(50),
      height: dynamicScale(35),
      borderRadius: 4,
    },
  };
}

/**
 * Default GlobalStyles using light theme for backward compatibility
 * Components should migrate to use useGlobalStyles() hook instead
 */
export const GlobalStyles = getGlobalStyles(lightTheme);

/**
 * Get category colors from theme
 */
export function getCatColors(theme: Theme) {
  return [
    theme.colors.cat2,
    theme.colors.cat3,
    theme.colors.cat5,
    theme.colors.cat6,
    theme.colors.cat7,
    theme.colors.cat8,
    theme.colors.cat9,
    theme.colors.cat1,
    theme.colors.cat4,
  ];
}

/**
 * Legacy export for backward compatibility
 */
export const CatColors = getCatColors(lightTheme);

export const ListLayoutAnimation = Layout;

/**
 * Hook to get theme-aware GlobalStyles
 * Usage: const styles = useGlobalStyles();
 *
 * Note: This hook should be used in components that need theme-aware styles.
 * For components that don't need theme support yet, they can continue using
 * the default GlobalStyles export (which uses light theme).
 *
 * Import this hook from the theme context file instead for proper implementation
 */
export function useGlobalStyles() {
  // This is a placeholder - actual implementation is in store/theme-context.tsx
  // Components should import useGlobalStyles from there
  return GlobalStyles;
}
