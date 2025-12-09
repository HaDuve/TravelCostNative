import { Platform, StyleSheet, View, Text } from "react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import { TripContext } from "../../store/trip-context";

import { i18n } from "../../i18n/i18n";

import { formatExpenseWithCurrency, truncateNumber } from "../../util/string";
import PropTypes from "prop-types";
import { Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { MAX_JS_NUMBER } from "../../confAppConstants";
import * as Haptics from "expo-haptics";
import { UserContext } from "../../store/user-context";
import { getRate } from "../../util/currencyExchange";
import { SettingsContext } from "../../store/settings-context";
import {
  ExpenseData,
  getExpensesSumPeriod,
  getTravellerSum,
} from "../../util/expense";
import { ExpensesContext, RangeString } from "../../store/expenses-context";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { CurrencyTicker } from "../UI/AnimatedNumber";
import {
  calculateDailyAverage,
  getBudgetColor,
} from "../../util/budgetColorHelper";

const ExpensesSummary = ({ expenses, periodName, style = {} }) => {
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const expCtx = useContext(ExpensesContext);
  const { settings } = useContext(SettingsContext);
  const hideSpecial = settings.hideSpecialExpenses;
  const [isToastShowing, setIsToastShowing] = useState(false);

  const [lastRate, setLastRate] = useState(1);
  const lastRateUnequal1 = lastRate !== 1;
  const getRateCallback = useCallback(async () => {
    if (!userCtx.lastCurrency || !tripCtx.tripCurrency) {
      setLastRate(1);
      return;
    }
    setLastRate(await getRate(tripCtx.tripCurrency, userCtx.lastCurrency));
  }, [tripCtx.tripCurrency, userCtx.lastCurrency]);
  useEffect(() => {
    async function call() {
      await getRateCallback();
    }
    call();
  }, [userCtx.lastCurrency, tripCtx.tripCurrency, getRateCallback]);

  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const travellers = Array.isArray(tripCtx.travellers)
    ? tripCtx.travellers
    : [];
  const travellerNames = travellers.map((traveller) =>
    typeof traveller === "string" ? traveller : traveller?.userName
  );
  const tripCurrency = tripCtx.tripCurrency || userCtx.lastCurrency || "";
  const isOfflineMissingTrip =
    !tripCtx.tripid && travellers.length === 0 && !tripCurrency;

  if (!periodName || userCtx.freshlyCreated) return <></>;

  if (isOfflineMissingTrip) {
    return (
      <View style={[styles.container, style]}>
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

  const expensesSumString = formatExpenseWithCurrency(
    truncateNumber(expensesSum, 1000, true),
    tripCurrency
  );

  const calcExpensesSumString =
    lastRate == 1
      ? ""
      : formatExpenseWithCurrency(
          truncateNumber(expensesSum * lastRate, 1000, true),
          userCtx.lastCurrency
        );

  let budgetNumber = Number(tripCtx.dailyBudget ?? 0);
  let infinityString = "";
  let periodExpenses: ExpenseData[] = [];
  let periodLabel = "";
  const expenseSumNum = Number(expensesSum);
  let totalBudget = Number(tripCtx.totalBudget ?? 0);
  if (Number.isNaN(totalBudget)) totalBudget = 0;
  if (Number.isNaN(budgetNumber)) budgetNumber = 0;

  let budgetMult = 1;
  switch (periodName) {
    case "day":
      periodExpenses = expCtx.getRecentExpenses(RangeString.day) || [];
      periodLabel = i18n.t("todayLabel");
      break;
    case "week":
      budgetMult = 7;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.week) || [];
      periodLabel = i18n.t("weekLabel");
      break;
    case "month":
      budgetMult = 30;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.month) || [];
      periodLabel = i18n.t("monthLabel");
      break;
    case "year":
      budgetMult = 365;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.year) || [];
      periodLabel = i18n.t("yearLabel");
      break;
    case "total":
      budgetNumber = totalBudget ?? MAX_JS_NUMBER;
      periodExpenses = expCtx.expenses || [];
      periodLabel = i18n.t("totalLabel");
      break;
    default:
      break;
  }
  const travellerSplitExpenseSums = travellerNames.map((travellerName) => {
    return getTravellerSum(
      periodExpenses,
      travellerName || "",
      periodName === "total"
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
        expCtx,
        tripCtx,
        hideSpecial
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
        settings.trafficLightBudgetColors
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
  const calcLeftToSpend = lastRateUnequal1
    ? formatExpenseWithCurrency(
        truncateNumber((budgetNumber - expenseSumNum) * lastRate, 1000, true),
        userCtx.lastCurrency
      )
    : "";
  const leftToSpendString = `${i18n.t(
    "youHaveXLeftToSpend1"
  )}:\n${formatExpenseWithCurrency(
    truncateNumber(budgetNumber - expenseSumNum, 1000, true),
    tripCurrency
  )}${lastRateUnequal1 ? " = " : ""}${calcLeftToSpend}${i18n.t(
    "youHaveXLeftToSpend2"
  )}`;

  const calcOverBudget = lastRateUnequal1
    ? formatExpenseWithCurrency(
        truncateNumber((expenseSumNum - budgetNumber) * lastRate, 1000, true),
        userCtx.lastCurrency
      )
    : "";

  const overBudgetString = `${i18n.t(
    "exceededBudgetByX1"
  )}:\n${formatExpenseWithCurrency(
    truncateNumber(expenseSumNum - budgetNumber, 1000, true),
    tripCurrency
  )}${lastRateUnequal1 ? " = " : ""}${calcOverBudget} !`;

  const periodBudgetString = `${periodLabel} ${i18n.t(
    "budget"
  )} :\n${formatExpenseWithCurrency(
    budgetNumber,
    tripCtx.tripCurrency
  )} = ${formatExpenseWithCurrency(
    budgetNumber * lastRate,
    userCtx.lastCurrency
  )}`;

  const valid = tripCtx.tripid && travellerNames.length > 0;
  const pressBudgetHandler = () => {
    if (isToastShowing) {
      setIsToastShowing(false);
      Toast.hide();
      return;
    }
    setIsToastShowing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (infinityString) {
      Toast.show({
        type: "error",
        text1: i18n.t("noTotalBudget"),
        text2: i18n.t("infinityLeftToSpend"),
        onHide() {
          setIsToastShowing(false);
        },
      });
      return;
    }
    const tripCurrency = tripCtx.tripCurrency;
    const lastCurrency = userCtx.lastCurrency;
    if (!valid) {
      Toast.hide();
      setIsToastShowing(false);
      return;
    }
    Toast.show({
      type: "budgetOverview",
      position: "bottom",
      text1: `${periodLabel} ${i18n.t("expenses")} :\n${expensesSumString} ${
        lastRateUnequal1 ? "=" : ""
      } ${calcExpensesSumString}`,
      text2:
        budgetNumber > expenseSumNum
          ? `${leftToSpendString}`
          : `${overBudgetString}`,
      bottomOffset: 40,
      visibilityTime: 20000,
      onHide: () => {
        setIsToastShowing(false);
      },
      props: {
        text3: `${formatExpenseWithCurrency(
          1,
          tripCurrency
        )} = ${formatExpenseWithCurrency(lastRate, lastCurrency)}`,
        travellerList: travellerNames,
        travellerBudgets:
          travellerNames.length > 0 ? budgetNumber / travellerNames.length : 0,
        budgetNumber: budgetNumber,
        travellerSplitExpenseSums: travellerSplitExpenseSums,
        currency: tripCurrency,
        noTotalBudget: noTotalBudget,
        periodName: periodName,
        periodLabel: periodLabel,
        periodBudgetString: periodBudgetString,
        lastRateUnequal1: lastRateUnequal1,
        trafficLightActive: settings.trafficLightBudgetColors,
        currentBudgetColor: budgetColor,
        averageDailySpending: averageDailySpending,
        dailyBudget: dailyBudget,
        expenseSumNum: expenseSumNum,
      },
    });
  };

  return (
    <Pressable
      onPress={() => pressBudgetHandler()}
      style={({ pressed }) => [
        styles.container,
        style,
        GlobalStyles.shadow,
        pressed && GlobalStyles.pressedWithShadow,
      ]}
    >
      <View style={styles.sumTextContainer}>
        <CurrencyTicker
          value={expenseSumNum}
          currency={tripCurrency}
          fontSize={dynamicScale(32, false, 0.5)}
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
        borderRadius={dynamicScale(8)}
        progress={budgetProgress}
        height={constantScale(12, 0.5)}
      />
    </Pressable>
  );
};

export default ExpensesSummary;

ExpensesSummary.propTypes = {
  expenses: PropTypes.array.isRequired,
  periodName: PropTypes.string.isRequired,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: "50%",
    alignItems: "center",
    ...Platform.select({
      ios: {
        paddingTop: dynamicScale(4, true),
        paddingLeft: dynamicScale(8),
        paddingRight: dynamicScale(8),
        marginBottom: dynamicScale(-4, true),
      },
      android: {
        paddingTop: dynamicScale(4, true),
        paddingLeft: dynamicScale(8),
        paddingRight: dynamicScale(8),
        marginBottom: dynamicScale(-4, true),
      },
    }),
  },
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
