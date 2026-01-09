import React from "react";
import { StyleSheet, View, FlatList, Text, Pressable } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import * as Progress from "react-native-progress";
import { formatExpenseWithCurrency } from "../../util/string";
import { constantScale, dynamicScale, scale } from "../../util/scalingUtil";
import { getCatLocalized } from "../../util/category";

export interface BudgetOverviewContentProps {
  travellerList: string[];
  travellerBudgets: number;
  travellerSplitExpenseSums: number[];
  currency: string;
  noTotalBudget: boolean;
  periodName: string;
  periodLabel: string;
  lastRateUnequal1?: boolean;
  trafficLightActive: boolean;
  currentBudgetColor: string;
  averageDailySpending: number;
  dailyBudget: number;
  expenseSumNum: number;
  budgetNumber: number;
  showCloseButton?: boolean;
  onClose?: () => void;
}

type TrafficLightStatus = "green" | "yellow" | "red" | null;

export const BudgetOverviewContent: React.FC<BudgetOverviewContentProps> = ({
  travellerList,
  travellerBudgets,
  travellerSplitExpenseSums,
  currency,
  noTotalBudget,
  periodName,
  periodLabel,
  lastRateUnequal1,
  trafficLightActive,
  currentBudgetColor,
  averageDailySpending,
  dailyBudget,
  expenseSumNum,
  budgetNumber,
  showCloseButton = true,
  onClose,
}) => {
  const hasMultipleTravellers = travellerList && travellerList.length > 1;
  const travellerCount = travellerList?.length || 1;
  const isYellowStatus =
    trafficLightActive && currentBudgetColor === GlobalStyles.colors.accent500;

  const getTrafficLightStatus = (): TrafficLightStatus => {
    if (
      !trafficLightActive ||
      noTotalBudget ||
      averageDailySpending <= 0 ||
      dailyBudget <= 0
    ) {
      return null;
    }

    if (expenseSumNum <= budgetNumber) {
      return "green";
    }

    if (averageDailySpending <= dailyBudget) {
      return "yellow";
    }

    return "red";
  };

  const trafficLightStatus = getTrafficLightStatus();

  return (
    <View
      style={[styles.budgetOverviewContainer, GlobalStyles.wideStrongShadow]}
    >
      <View style={styles.budgetOverviewHeader}>
        <Text style={styles.overviewTextTitle}>{i18n.t("overview")}</Text>
        {showCloseButton && (
          <Pressable onPress={onClose}>
            <Text style={styles.overviewTextTitle}>X</Text>
          </Pressable>
        )}
      </View>

      {hasMultipleTravellers && (
        <FlatList
          data={travellerList}
          ListHeaderComponent={() => {
            // Handle category-* format for periodName
            let periodDisplayName = periodName;
            if (periodName.startsWith("category-")) {
              const category = periodName.replace("category-", "");
              periodDisplayName = getCatLocalized(category);
            } else {
              try {
                periodDisplayName = i18n.t(periodName);
              } catch {
                // If translation fails, use the original periodName
                periodDisplayName = periodName;
              }
            }
            return (
              <Text style={styles.overviewTextInfo}>
                {i18n.t("budgetPerTraveller")}:{" "}
                {formatExpenseWithCurrency(travellerBudgets, currency)} /{" "}
                {periodDisplayName}
              </Text>
            );
          }}
          renderItem={({ item, index }) => {
            const sum = formatExpenseWithCurrency(
              +travellerSplitExpenseSums[index].toFixed(2),
              currency
            );
            const budgetProgress =
              travellerSplitExpenseSums[index] / travellerBudgets;
            const budgetColor = noTotalBudget
              ? GlobalStyles.colors.primary500
              : budgetProgress <= 1
                ? GlobalStyles.colors.primary500
                : isYellowStatus
                  ? GlobalStyles.colors.accent500
                  : GlobalStyles.colors.error300;
            const unfilledColor: string = noTotalBudget
              ? GlobalStyles.colors.primary500
              : budgetProgress <= 1
                ? GlobalStyles.colors.gray600
                : GlobalStyles.colors.gray600;
            const travellerName = item;
            return (
              <View style={styles.travellerItemContainer}>
                <Text style={styles.overviewTextSmall}>{travellerName}</Text>
                <View
                  style={[
                    styles.travellerItemProgressBarContainer,
                    GlobalStyles.shadow,
                  ]}
                >
                  <Progress.Bar
                    color={budgetColor}
                    unfilledColor={unfilledColor}
                    borderWidth={0}
                    progress={budgetProgress}
                    width={scale(180)}
                    height={constantScale(20, 0.5)}
                    borderRadius={dynamicScale(8, false, 0.5)}
                  ></Progress.Bar>
                  <Text style={styles.overViewTextTravellerSum}>{sum}</Text>
                </View>
              </View>
            );
          }}
        ></FlatList>
      )}
      {trafficLightStatus && (
        <Text style={styles.overviewTextInfo}>
          {trafficLightStatus === "green" &&
            `🟢 - ${i18n.t("averageDailySpending")}: ${formatExpenseWithCurrency(
              averageDailySpending / travellerCount,
              currency
            )}`}
          {trafficLightStatus === "yellow" &&
            `🟡 - ${i18n.t("overBudgetButAverage")}: ${formatExpenseWithCurrency(
              averageDailySpending / travellerCount,
              currency
            )}\n${i18n.t("underDailyBudget")}: ${formatExpenseWithCurrency(
              dailyBudget / travellerCount,
              currency
            )}`}
          {trafficLightStatus === "red" &&
            `🔴 - ${i18n.t("trafficLightOverBudgetAndAverage")}\n${i18n.t("averageDailySpending")}: ${formatExpenseWithCurrency(
              averageDailySpending / travellerCount,
              currency
            )}\n${i18n.t("dailyBudget")}: ${formatExpenseWithCurrency(
              dailyBudget / travellerCount,
              currency
            )}`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  budgetOverviewContainer: {
    flex: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderWidth: 1,
    borderRadius: 36,
    paddingHorizontal: dynamicScale(30),
    paddingVertical: dynamicScale(12),
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
  },
  budgetOverviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  travellerItemContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    minHeight: dynamicScale(40, true),
    overflow: "visible",
    marginVertical: dynamicScale(4, true),
  },
  travellerItemProgressBarContainer: {
    padding: dynamicScale(2),
    overflow: "visible",
    alignSelf: "center",
    marginTop: dynamicScale(4, true),
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  overViewTextTravellerSum: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
    position: "absolute",
    width: scale(180),
    paddingTop: dynamicScale(2, true),
  },
  overviewTextInfo: {
    fontSize: dynamicScale(12, false, 0.5),
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: dynamicScale(8, true),
  },
  overviewTextSmall: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "200",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: dynamicScale(4, true),
  },
  overviewTextTitle: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "500",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: dynamicScale(8, true),
  },
});
