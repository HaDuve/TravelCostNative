import { Platform, StyleSheet, View, Text } from "react-native";
import React, { useContext, useState } from "react";
import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles, periodHeaderLabelFontSize } from "../../styles/shadow-regression-styles";
import * as Progress from "react-native-progress";
import { TripContext } from "../../store/trip-context";
import { travellerUserNames } from "../../util/normalize-travellers";

import { i18n } from "../../i18n/i18n";

import PropTypes from "prop-types";
import { Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { MAX_JS_NUMBER } from "../../confAppConstants";
import * as Haptics from "expo-haptics";
import { UserContext } from "../../store/user-context";
import { SettingsContext } from "../../store/settings-context";
import {
  ExpenseData,
  getExpensesSumPeriod,
} from "../../util/expense";
import { sumByTraveller } from "../../util/expenseTotals";
import { ExpensesContext, RangeString } from "../../store/expenses-context";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { CurrencyTicker } from "../UI/AnimatedNumber";
import {
  calculateDailyAverage,
  getBudgetColor,
} from "../../util/budget";
import BudgetOverviewModal from "./BudgetOverviewModal";

const ExpensesSummary = ({ expenses, periodName, style = {} }) => {
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const expCtx = useContext(ExpensesContext);
  const { settings } = useContext(SettingsContext);
  const hideSpecial = settings.hideSpecialExpenses;
  const [isOverviewVisible, setIsOverviewVisible] = useState(false);

  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const travellerNames = travellerUserNames(tripCtx.travellers ?? []);
  const tripCurrency = tripCtx.tripCurrency || userCtx.lastCurrency || "";
  const isOfflineMissingTrip =
    !tripCtx.tripid && travellerNames.length === 0 && !tripCurrency;

  if (!periodName || userCtx.freshlyCreated) return <></>;

  if (isOfflineMissingTrip) {
    return (
      <View style={style}>
        <Text style={styles.offlineText}>
          {i18n.t("offline")}: {i18n.t("noDataAvailable")}
        </Text>
      </View>
    );
  }

  const expensesSum = getExpensesSumPeriod(safeExpenses, hideSpecial);

  if (isNaN(Number(expensesSum))) {
    return <></>;
  }

  let budgetNumber = Number(tripCtx.dailyBudget ?? 0);
  let infinityString = "";
  let periodExpenses: ExpenseData[] = [];
  const expenseSumNum = Number(expensesSum);
  let totalBudget = Number(tripCtx.totalBudget ?? 0);
  if (Number.isNaN(totalBudget)) totalBudget = 0;
  if (Number.isNaN(budgetNumber)) budgetNumber = 0;

  let budgetMult = 1;
  switch (periodName) {
    case "day":
      periodExpenses = expCtx.getRecentExpenses(RangeString.day) || [];
      break;
    case "week":
      budgetMult = 7;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.week) || [];
      break;
    case "month":
      budgetMult = 30;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.month) || [];
      break;
    case "year":
      budgetMult = 365;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.year) || [];
      break;
    case "total":
      budgetNumber = totalBudget ?? MAX_JS_NUMBER;
      periodExpenses = expCtx.expenses || [];
      break;
    default:
      break;
  }
  const travellerSplitExpenseSums = travellerNames.map((travellerName) => {
    return sumByTraveller(
      periodExpenses,
      travellerName || "",
      periodName === "total",
    );
  });

  if (!budgetNumber || budgetNumber == MAX_JS_NUMBER) infinityString = "∞";
  if (budgetNumber > (totalBudget ?? MAX_JS_NUMBER)) budgetNumber = totalBudget;
  const noTotalBudget =
    !tripCtx.totalBudget ||
    tripCtx.totalBudget == "0" ||
    tripCtx.totalBudget == "" ||
    isNaN(Number(tripCtx.totalBudget)) ||
    tripCtx.totalBudget >= MAX_JS_NUMBER.toString();
  let budgetProgress =
    budgetNumber > 0 ? (expenseSumNum / budgetNumber) * 1 : 0;

  const today = new Date();
  const averageDailySpending = settings.trafficLightBudgetColors
    ? calculateDailyAverage(
        periodName as "day" | "week" | "month" | "year" | "total",
        today,
        expCtx.expenses || [],
        {
          startDate: tripCtx.startDate,
        },
        hideSpecial,
      )
    : 0;

  const dailyBudget = Number(tripCtx.dailyBudget) || 0;
  const budgetColor = noTotalBudget
    ? GlobalStyles.colors.primary500
    : getBudgetColor(
        expenseSumNum,
        budgetNumber,
        averageDailySpending,
        dailyBudget,
        settings.trafficLightBudgetColors,
      );

  let unfilledColor = GlobalStyles.colors.gray600;
  if (!noTotalBudget) {
    if (budgetColor === GlobalStyles.colors.error300) {
      unfilledColor = GlobalStyles.colors.errorGrayed;
    } else if (budgetColor === GlobalStyles.colors.accent500) {
      unfilledColor = GlobalStyles.colors.gray600;
    } else {
      unfilledColor = GlobalStyles.colors.gray600;
    }
  } else {
    unfilledColor = GlobalStyles.colors.primary500;
  }

  if (budgetProgress > 1) budgetProgress -= 1;
  if (noTotalBudget) {
    budgetProgress = 0;
  }
  if (Number.isNaN(budgetProgress)) {
    return <></>;
  }
  const valid = tripCtx.tripid && travellerNames.length > 0;
  const closeOverview = () => setIsOverviewVisible(false);

  const pressBudgetHandler = () => {
    if (isOverviewVisible) {
      closeOverview();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (infinityString) {
      Toast.show({
        type: "error",
        text1: i18n.t("noTotalBudget"),
        text2: i18n.t("infinityLeftToSpend"),
      });
      return;
    }
    if (!valid) {
      return;
    }
    setIsOverviewVisible(true);
  };

  return (
    <>
    <BudgetOverviewModal
      isVisible={isOverviewVisible}
      onClose={closeOverview}
      travellerList={travellerNames}
      travellerBudgets={
        travellerNames.length > 0 ? budgetNumber / travellerNames.length : 0
      }
      travellerSplitExpenseSums={travellerSplitExpenseSums}
      currency={tripCurrency}
      noTotalBudget={noTotalBudget}
      periodName={periodName}
      trafficLightActive={settings.trafficLightBudgetColors}
      currentBudgetColor={budgetColor}
      averageDailySpending={averageDailySpending}
      dailyBudget={dailyBudget}
      expenseSumNum={expenseSumNum}
      budgetNumber={budgetNumber}
    />
    <Pressable
      testID="expenses-summary-pressable"
      onPress={() => pressBudgetHandler()}
      style={({ pressed }) => [
        shadowRegressionStyles.expensesSummaryContainer,
        style,
        pressed && GlobalStyles.pressedWithShadow,
      ]}
    >
      <View style={styles.sumTextContainer}>
        <CurrencyTicker
          value={expenseSumNum}
          currency={tripCurrency}
          fontSize={periodHeaderLabelFontSize}
          style={{ color: budgetColor }}
          truncate={true}
          truncateLimit={1000}
          disableAnimation={settings.disableNumberAnimations}
        />
      </View>
      <Progress.Bar
        color={budgetColor}
        unfilledColor={unfilledColor}
        borderWidth={0}
        borderRadius={dynamicScale(6)}
        progress={budgetProgress}
        height={constantScale(6, 0.5)}
      />
    </Pressable>
    </>
  );
};

export default ExpensesSummary;

ExpensesSummary.propTypes = {
  expenses: PropTypes.array.isRequired,
  periodName: PropTypes.string.isRequired,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  sumTextContainer: {
    alignItems: "center",
  },
  offlineText: {
    color: GlobalStyles.colors.primary500,
    textAlign: "center",
  },
  sum: {
    fontSize: dynamicScale(32, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary500,
    ...Platform.select({
      android: {
        textShadowColor: "rgba(0, 0, 0, 0.15)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 8,
      },
    }),
  },
});
