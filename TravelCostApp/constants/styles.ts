export const GlobalStyles = {
  colors: {
    primary50: "#C5E5D5",
    primary100: "#A1D8C1",
    primary200: "#60B5A9",
    primary400: "#008C70",
    // primary500: "#007A61",
    // primary500: "#538076",
    primary500: "#538076",
    primary700: "#006A55",
    primary800: "#005645",
    primaryGrayed: "#8B939C",
    secondaryMain500: "#00BB95",
    accent250: "#ccad8f",
    accent500: "#DC7813",
    accent700: "#AF7063",
    backgroundColor: "#F8F8F8",
    // backgroundColor: "#FFF",
    // backgroundColor: "#F5F5F5",
    textColor: "#434343",
    error50: "#fcc4e4",
    error300: "#cf6157",
    error500: "#B42113",
    errorGrayed: "#b5837f",
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

  tabBarColors: ["#FFFFFF", "#FBF0A8", "#A1D8C1", "#538076", "#DCDCDC"],
  buttonTextPrimary: {
    color: "#FFFFFF",
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "300",
  },
  buttonTextGradient: {
    color: "#FFFFFF",
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "300",
  },
  buttonTextFlat: {
    color: "#008C70",
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "300",
  },
  secondaryText: {
    fontSize: 14,
    color: "#626262",
    fontWeight: "300",
  },
  shadow: {
    elevation: 2,
    shadowColor: "#BFBFBF",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.75,
    shadowRadius: 1.3,
  },
  strongShadow: {
    elevation: 4,
    shadowColor: "#002A22",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 1.3,
  },
  shadowPrimary: {
    elevation: 2,
    borderColor: "#538076",
    shadowColor: "#538076",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.75,
  },
  pressedWithShadow: {
    elevation: 0,
    transform: [{ scale: 0.9 }],
    shadowOpacity: 0.12,
    shadowOffset: { width: 1, height: 1 },
    shadowRadius: 1,
    opacity: 0.9,
  },
  pressed: {
    elevation: 0,
    transform: [{ scale: 0.9 }],
    opacity: 0.9,
  },
};
export const CatColors = [
  GlobalStyles.colors.cat2,
  GlobalStyles.colors.cat3,
  GlobalStyles.colors.cat5,
  GlobalStyles.colors.cat6,
  GlobalStyles.colors.cat7,
  GlobalStyles.colors.cat8,
  GlobalStyles.colors.cat9,
  GlobalStyles.colors.cat1,
  GlobalStyles.colors.cat4,
];