import { Platform, StyleSheet } from "react-native";

import { GlobalStyles } from "../constants/styles";
import { constantScale, dynamicScale } from "../util/scalingUtil";

export const periodHeaderLabelFontSize = dynamicScale(28, false, 0.5);

const statisticsCardShadow = {
  backgroundColor: GlobalStyles.colors.backgroundColor,
  borderRadius: dynamicScale(10, false, 0.5),
  borderWidth: 1,
  borderColor: GlobalStyles.colors.gray300,
  marginHorizontal: dynamicScale(16),
  marginBottom: dynamicScale(20, true),
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

const overviewHeaderCardShadow = Platform.select({
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
});

const overviewHeaderCardBase = {
  flex: 1,
  maxWidth: "50%" as const,
  minHeight: dynamicScale(52, true),
  backgroundColor: GlobalStyles.colors.backgroundColor,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: GlobalStyles.colors.gray300,
  paddingVertical: dynamicScale(4, true),
  ...overviewHeaderCardShadow,
};

export const shadowRegressionStyles = StyleSheet.create({
  statisticsPieCategoryCard: statisticsCardShadow,
  expenseGraphCategoryCard: {
    height: dynamicScale(65, true),
    minWidth: dynamicScale(200),
    ...statisticsCardShadow,
  },
  overviewDropdownContainer: {
    ...overviewHeaderCardBase,
    marginTop: dynamicScale(2, true),
    alignItems: "center",
    justifyContent: "center",
  },
  overviewDropdownInner: {
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  overviewPeriodHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "stretch",
    gap: dynamicScale(12, true),
    zIndex: 10,
    marginTop: dynamicScale(18, true),
    paddingHorizontal: dynamicScale(12),
    marginBottom: dynamicScale(12, true),
  },
  overviewPeriodDateHeader: {
    marginTop: dynamicScale(12, true),
    marginLeft: dynamicScale(18),
    marginBottom: dynamicScale(-4, true),
  },
  expensesSummaryContainer: {
    ...overviewHeaderCardBase,
    alignItems: "center",
    justifyContent: "center",
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
  expenseCountryFlagContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.shadow,
  },
  splitBalanceRow: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.strongShadow,
  },
  splitSummaryCard: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    ...GlobalStyles.wideStrongShadow,
  },
  tripHistoryCard: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    ...GlobalStyles.wideStrongShadow,
  },
  tripTravellerChip: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.strongShadow,
    ...Platform.select({
      android: {
        backgroundColor: GlobalStyles.colors.gray300,
      },
    }),
  },
  changelogItem: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    ...GlobalStyles.strongShadow,
  },
  overviewDividerBar: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderBottomColor: GlobalStyles.colors.gray600,
    minHeight: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 0,
  },
  tripTravellerAvatar: {
    minHeight: dynamicScale(20, false, 0.5),
    minWidth: dynamicScale(20, false, 0.5),
    borderRadius: dynamicScale(60, false, 0.5),
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
    marginRight: dynamicScale(14, false, 0.5),
    ...GlobalStyles.shadowPrimary,
  },
});
