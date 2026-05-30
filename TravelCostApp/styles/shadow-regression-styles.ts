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
    height: dynamicScale(52, true),
    minWidth: dynamicScale(200),
    justifyContent: "center",
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
  addExpenseFab: {
    backgroundColor: GlobalStyles.colors.primary400,
    ...GlobalStyles.shadowGlowPrimary,
  },
  scrollToTopFab: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.shadowPrimary,
  },
  toastSurface: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.wideStrongShadow,
  },
  toastStrongSurface: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.strongShadow,
  },
  toastProgressBarTrack: {
    backgroundColor: GlobalStyles.colors.gray300,
  },
  toastBannerShell: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.wideStrongShadow,
  },
  changelogSectionHeader: {
    margin: constantScale(12, 0.5),
    padding: constantScale(24, 0.5),
    paddingTop: constantScale(12, 0.5),
    paddingBottom: constantScale(12, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 24,
    ...GlobalStyles.shadowGlowPrimary,
  },
  tripSummaryExpandableHeader: {
    margin: constantScale(12, 0.5),
    padding: constantScale(24, 0.5),
    paddingTop: constantScale(12, 0.5),
    paddingBottom: constantScale(12, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: constantScale(80, 0.5),
    ...GlobalStyles.shadowGlowPrimary,
  },
  tripSummaryTripListHeader: {
    margin: constantScale(12, 0.5),
    padding: constantScale(16, 0.5),
    gap: constantScale(8, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 24,
    alignItems: "stretch",
    justifyContent: "flex-start",
    minHeight: constantScale(80, 0.5),
    ...GlobalStyles.shadowGlowPrimary,
  },
  tripSummaryTripItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: dynamicScale(8, false, 0.5),
    padding: dynamicScale(12, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    marginVertical: dynamicScale(4, false, 0.5),
    marginHorizontal: dynamicScale(8, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(8, false, 0.5),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    ...GlobalStyles.shadow,
  },
  tripSummaryTripItemSelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: dynamicScale(8, false, 0.5),
    padding: dynamicScale(12, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    marginVertical: dynamicScale(4, false, 0.5),
    marginHorizontal: dynamicScale(8, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(8, false, 0.5),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    ...GlobalStyles.shadowPrimary,
  },
  expenseFormStrongSurface: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...GlobalStyles.strongShadow,
  },
  gradientButtonShadow: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#538076",
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 2.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dropdownListContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
