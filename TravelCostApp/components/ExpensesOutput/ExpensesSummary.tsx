import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import { TripContext } from "../../store/trip-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

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
  getExpensesSum,
  getTravellerSum,
} from "../../util/expense";
import { ExpensesContext, RangeString } from "../../store/expenses-context";
import { constantScale, dynamicScale } from "../../util/scalingUtil";

const ExpensesSummary = ({
  expenses,
  periodName,
  useMoreSpace = false,
  style = {},
}) => {
  const { width: screenWidth } = Dimensions.get("window");
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

  if (!expenses || !periodName || userCtx.freshlyCreated) return <></>;

  const expensesSum = getExpensesSum(expenses, hideSpecial);
  // // console.log("expensesSum ~ expensesSum", expensesSum);
  if (isNaN(Number(expensesSum))) {
    // console.log("expensesSum is NaN");
    return <></>;
  }

  const tripCurrency = tripCtx.tripCurrency;
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

  let budgetNumber = Number(tripCtx.dailyBudget);
  let infinityString = "";
  let periodExpenses: ExpenseData[] = [];
  let periodLabel = "";
  const expenseSumNum = Number(expensesSum);
  const totalBudget = Number(tripCtx.totalBudget);

  let budgetMult = 1;
  switch (periodName) {
    case "day":
      periodExpenses = expCtx.getRecentExpenses(RangeString.day);
      periodLabel = i18n.t("todayLabel");
      break;
    case "week":
      budgetMult = 7;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.week);
      periodLabel = i18n.t("weekLabel");
      break;
    case "month":
      budgetMult = 30;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.month);
      periodLabel = i18n.t("monthLabel");
      break;
    case "year":
      budgetMult = 365;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.year);
      periodLabel = i18n.t("yearLabel");
      break;
    case "total":
      budgetNumber = totalBudget ?? MAX_JS_NUMBER;
      periodExpenses = expCtx.expenses;
      periodLabel = i18n.t("totalLabel");
      break;
    default:
      break;
  }
  const travellers = tripCtx.travellers;
  const travellerSplitExpenseSums = travellers.map((traveller) => {
    return getTravellerSum(periodExpenses, traveller);
  });

  if (!budgetNumber || budgetNumber == MAX_JS_NUMBER) infinityString = "∞";
  if (budgetNumber > totalBudget ?? MAX_JS_NUMBER) budgetNumber = totalBudget;
  const noTotalBudget =
    !tripCtx.totalBudget ||
    tripCtx.totalBudget == "0" ||
    tripCtx.totalBudget == "" ||
    isNaN(Number(tripCtx.totalBudget)) ||
    tripCtx.totalBudget >= MAX_JS_NUMBER.toString();
  let budgetProgress = (expenseSumNum / budgetNumber) * 1;
  const budgetColor = noTotalBudget
    ? GlobalStyles.colors.primary500
    : budgetProgress <= 1
    ? GlobalStyles.colors.primary500
    : GlobalStyles.colors.error300;
  const unfilledColor = noTotalBudget
    ? GlobalStyles.colors.primary500
    : budgetProgress <= 1
    ? GlobalStyles.colors.gray600
    : GlobalStyles.colors.errorGrayed;

  if (budgetProgress > 1) budgetProgress -= 1;
  if (noTotalBudget) {
    budgetProgress = 0;
  }
  if (Number.isNaN(budgetProgress)) {
    // console.log("NaN budgetProgress");
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

  const valid =
    tripCtx.tripid && tripCtx.travellers && tripCtx.travellers?.length > 0;
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
    // show Toast containing budget info
    const tripCurrency = tripCtx.tripCurrency;
    const lastCurrency = userCtx.lastCurrency;
    // const lastRate = lastRate
    if (!valid) {
      Toast.hide();
      setIsToastShowing(false);
      return;
    }
    Toast.show({
      // type: budgetNumber > expenseSumNum ? "success" : "error",
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
        travellerList: tripCtx.travellers,
        // travellerBudgets: tripCtx.travellerBudgets
        travellerBudgets: budgetNumber / tripCtx.travellers.length,
        budgetNumber: budgetNumber,
        travellerSplitExpenseSums: travellerSplitExpenseSums,
        currency: tripCurrency,
        noTotalBudget: noTotalBudget,
        periodName: periodName,
        periodLabel: periodLabel,
        periodBudgetString: periodBudgetString,
        lastRateUnequal1: lastRateUnequal1,
      },
    });
  };

  return (
    <Pressable
      onPress={() => pressBudgetHandler()}
      style={({ pressed }) => [
        styles.container,
        style,
        useMoreSpace && styles.useMoreSpaceContainer,
        GlobalStyles.shadow,
        pressed && GlobalStyles.pressedWithShadow,
      ]}
    >
      <View style={styles.sumTextContainer}>
        <Text style={[styles.sum, { color: budgetColor }]}>
          {expensesSumString}
        </Text>
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
  useMoreSpace: PropTypes.bool,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: "red",
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
  useMoreSpaceContainer: {
    maxWidth: "90%",
    paddingTop: dynamicScale(8, true),
    paddingBottom: dynamicScale(4, true),
    paddingLeft: dynamicScale(4),
    paddingRight: dynamicScale(4),
  },
  sumTextContainer: {
    alignItems: "center",
  },
  sum: {
    fontSize: dynamicScale(32, false, 0.5),
    fontWeight: "bold",
    // padding: 4,
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
