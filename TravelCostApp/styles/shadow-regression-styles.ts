import { Platform, StyleSheet } from "react-native";

import { GlobalStyles } from "../constants/styles";
import { constantScale, dynamicScale } from "../util/scalingUtil";

const statisticsCardShadow = {
  backgroundColor: GlobalStyles.colors.backgroundColor,
  borderRadius: dynamicScale(10, false, 0.5),
  ...Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: {
        width: 1,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 2.84,
    },
    android: {
      elevation: 5,
    },
  }),
};

export const shadowRegressionStyles = StyleSheet.create({
  statisticsPieCategoryCard: statisticsCardShadow,
  expenseGraphCategoryCard: {
    height: dynamicScale(65, true),
    minWidth: dynamicScale(200),
    ...statisticsCardShadow,
  },
  overviewDropdownContainer: {
    maxWidth: dynamicScale(170, false, 0.5),
    marginTop: dynamicScale(2, true),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: GlobalStyles.colors.textColor,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
        borderRadius: 12,
      },
    }),
  },
  overviewFabToggleButton: {
    position: "absolute",
    bottom: dynamicScale(20, true),
    left: "50%",
    marginLeft: constantScale(-49, 0.08),
    zIndex: 1000,
    elevation: 10,
    ...GlobalStyles.shadowGlowPrimary,
  },
  expensesSummaryPressable: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  expenseCountryFlagContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.shadow,
  },
});
