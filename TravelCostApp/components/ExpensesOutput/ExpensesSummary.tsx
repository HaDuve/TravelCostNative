import { Platform, StyleSheet, Text, View } from "react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import { TripContext } from "../../store/trip-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { formatExpenseWithCurrency, truncateNumber } from "../../util/string";
import PropTypes from "prop-types";
import { Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { MAX_JS_NUMBER } from "../../confAppConstants";
import * as Haptics from "expo-haptics";
import { UserContext } from "../../store/user-context";
import { NetworkContext } from "../../store/network-context";
import { getRate } from "../../util/currencyExchange";
import { SettingsContext } from "../../store/settings-context";
import { ExpenseData, getExpensesSum } from "../../util/expense";

const ExpensesSummary = ({
  expenses,
  periodName,
  useMoreSpace = false,
  style = {},
}) => {
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const { settings } = useContext(SettingsContext);
  const hideSpecial = settings.hideSpecialExpenses;
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
  // console.log("expensesSum ~ expensesSum", expensesSum);
  if (isNaN(Number(expensesSum))) {
    console.log("expensesSum is NaN");
    return <></>;
  }

  const userCurrency = tripCtx.tripCurrency;
  const expensesSumString = formatExpenseWithCurrency(
    truncateNumber(expensesSum, 1000, true),
    userCurrency
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
  const expenseSumNum = Number(expensesSum);
  const totalBudget = Number(tripCtx.totalBudget);
  //TODO: change the dailybudget system to make calculating this unified
  let budgetMult = 1;
  switch (periodName) {
    case "day":
      break;
    case "week":
      budgetMult = 7;
      budgetNumber = budgetNumber * budgetMult;
      break;
    case "month":
      budgetMult = 30;
      budgetNumber = budgetNumber * budgetMult;

      break;
    case "year":
      budgetMult = 365;
      budgetNumber = budgetNumber * budgetMult;
      break;
    case "total":
      budgetNumber = totalBudget ?? MAX_JS_NUMBER;
      break;
    default:
      break;
  }

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
    console.log("NaN budgetProgress");
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
  )}${formatExpenseWithCurrency(
    truncateNumber(budgetNumber - expenseSumNum, 1000, true),
    userCurrency
  )}${lastRateUnequal1 ? " | " : ""}${calcLeftToSpend}${i18n.t(
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
  )}${formatExpenseWithCurrency(
    truncateNumber(expenseSumNum - budgetNumber, 1000, true),
    userCurrency
  )}${lastRateUnequal1 ? " | " : ""}${calcOverBudget} !`;

  const pressBudgetHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (infinityString) {
      Toast.show({
        type: "error",
        text1: i18n.t("noTotalBudget"),
        text2: i18n.t("infinityLeftToSpend"),
      });
      return;
    }
    // show Toast containing budget info
    Toast.show({
      type: budgetNumber > expenseSumNum ? "success" : "error",
      position: "bottom",
      text1: `${i18n.t(periodName)} ${i18n.t(
        "expenses"
      )}: ${expensesSumString} ${
        lastRateUnequal1 ? "|" : ""
      } ${calcExpensesSumString}`,
      text2:
        budgetNumber > expenseSumNum
          ? `${leftToSpendString}`
          : `${overBudgetString}`,
      visibilityTime: 5000,
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
        borderRadius={8}
        progress={budgetProgress}
        height={12}
        width={useMoreSpace ? 180 : 150}
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
    ...Platform.select({
      ios: {
        paddingTop: "1%",
        paddingLeft: "2%",
        marginRight: "-5%",
        marginBottom: "-2%",
      },
      android: {
        paddingTop: "1%",
        paddingLeft: "2%",
        marginRight: "-5%",
        marginBottom: "-2%",
      },
    }),
  },
  useMoreSpaceContainer: {
    paddingTop: "3%",
    paddingBottom: "1%",
    marginLeft: "-2%",
    paddingLeft: 0,
  },
  sumTextContainer: {
    alignItems: "center",
  },
  sum: {
    fontSize: 32,
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
