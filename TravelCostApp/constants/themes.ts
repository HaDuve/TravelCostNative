/**
 * Theme color definitions for light and dark modes
 * All colors are designed to meet WCAG AA contrast ratios
 */

export type ThemeMode = "light" | "dark" | "auto";
export type ThemeName = "light" | "dark";

export interface ThemeColors {
  // Primary colors (brand greens)
  primary50: string;
  primary100: string;
  primary200: string;
  primary400: string;
  primary500: string;
  primary700: string;
  primary800: string;
  primaryGrayed: string;
  secondaryMain500: string;

  // Accent colors
  accent250: string;
  accent500: string;
  accent700: string;

  // Background colors
  backgroundColor: string;
  backgroundColorLight: string;

  // Text colors
  textColor: string;
  textHidden: string;

  // Error colors
  error50: string;
  errorHidden: string;
  error300: string;
  error500: string;
  errorGrayed: string;

  // Gray scale
  gray300: string;
  gray500Accent: string;
  gray500: string;
  gray600: string;
  gray700: string;

  // Category colors (preserved for consistency)
  cat1: string;
  cat2: string;
  cat3: string;
  cat4: string;
  cat5: string;
  cat6: string;
  cat7: string;
  cat8: string;
  cat9: string;
}

export interface Theme {
  colors: ThemeColors;
  gradientColors: string[];
  gradientPrimaryButton: string[];
  gradientColorsButton: string[];
  gradientErrorButton: string[];
  gradientAccentButton: string[];
  tabBarColors: string[];
}

export const lightTheme: Theme = {
  colors: {
    primary50: "#C5E5D5",
    primary100: "#A1D8C1",
    primary200: "#60B5A9",
    primary400: "#008C70",
    primary500: "#538076",
    primary700: "#006A55",
    primary800: "#005645",
    primaryGrayed: "#8B939C",
    secondaryMain500: "#00BB95",
    accent250: "#ccad8f",
    accent500: "#DC7813",
    accent700: "#AF7063",
    backgroundColor: "#F8F8F8",
    backgroundColorLight: "#FBFBFB",
    textColor: "#434343",
    textHidden: "#9A9A9A",
    error50: "#fcc4e4",
    errorHidden: "#CF8B84",
    error300: "#cf6157",
    error500: "#B42113",
    errorGrayed: "#b5837f",
    gray300: "#F2F2F2",
    gray500Accent: "#D4D5C5",
    gray500: "#DCDCDC",
    gray600: "#BFBFBF",
    gray700: "#626262",
    cat1: "#dc3a4a",
    cat2: "#d4703f",
    cat3: "#e3c638",
    cat4: "#a4b21f",
    cat5: "#7dc73f",
    cat6: "#00b9aa",
    cat7: "#2fc2f7",
    cat8: "#0097e5",
    cat9: "#e10a8e",
  },
  gradientColors: ["#FEEF60", "#FBF0A8", "#A1D8C1"],
  gradientPrimaryButton: ["#A1D8C1", "#A1D8C1", "#538076", "#005645"],
  gradientColorsButton: ["#FEEF60", "#FBF0A8", "#A1D8C1"],
  gradientErrorButton: ["#fcc4e4", "#fcc4e4", "#cf6157", "#B42113"],
  gradientAccentButton: ["#FEEF60", "#FBF0A8", "#A1D8C1"],
  tabBarColors: ["#FFFFFF", "#FBF0A8", "#A1D8C1", "#538076", "#DCDCDC"],
};

export const darkTheme: Theme = {
  colors: {
    // Primary colors - adjusted for dark mode while maintaining brand identity
    primary50: "#1a3d2e",
    primary100: "#2d5a47",
    primary200: "#3d7a5f",
    primary400: "#4a9d7a",
    primary500: "#60B5A9", // Lighter for visibility on dark background
    primary700: "#7dd4c4",
    primary800: "#9ae8d8",
    primaryGrayed: "#6b7280",
    secondaryMain500: "#00d4a8",

    // Accent colors - adjusted for dark mode
    accent250: "#d4a574",
    accent500: "#ff9a4d",
    accent700: "#d4876b",

    // Background colors - dark theme
    backgroundColor: "#121212",
    backgroundColorLight: "#1e1e1e",

    // Text colors - light text on dark background
    textColor: "#E5E5E5",
    textHidden: "#9A9A9A",

    // Error colors - adjusted for dark mode
    error50: "#4a1a2a",
    errorHidden: "#8b4a54",
    error300: "#e57373",
    error500: "#ef5350",
    errorGrayed: "#b5837f",

    // Gray scale - inverted for dark mode
    gray300: "#2a2a2a",
    gray500Accent: "#3a3a3a",
    gray500: "#3d3d3d",
    gray600: "#5a5a5a",
    gray700: "#9a9a9a",

    // Category colors - slightly adjusted for better visibility on dark
    cat1: "#ff5a6b",
    cat2: "#ff8a5c",
    cat3: "#ffd93d",
    cat4: "#b8e63e",
    cat5: "#7dd87f",
    cat6: "#00d4a8",
    cat7: "#5bc0eb",
    cat8: "#3a9bd9",
    cat9: "#ff4da6",
  },
  gradientColors: ["#4a3d1a", "#5a4d2a", "#3d7a5f"],
  gradientPrimaryButton: ["#3d7a5f", "#3d7a5f", "#60B5A9", "#7dd4c4"],
  gradientColorsButton: ["#4a3d1a", "#5a4d2a", "#3d7a5f"],
  gradientErrorButton: ["#4a1a2a", "#4a1a2a", "#e57373", "#ef5350"],
  gradientAccentButton: ["#4a3d1a", "#5a4d2a", "#3d7a5f"],
  tabBarColors: ["#1e1e1e", "#3a3a3a", "#3d7a5f", "#60B5A9", "#2a2a2a"],
};

/**
 * Get theme colors based on theme name
 */
export function getTheme(themeName: ThemeName): Theme {
  return themeName === "dark" ? darkTheme : lightTheme;
}

