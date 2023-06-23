import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
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

import { formatExpenseWithCurrency } from "../../util/string";
import PropTypes from "prop-types";
import { Pressable } from "react-native";
import Toast from "react-native-toast-message";
import { MAX_JS_NUMBER } from "../../confAppConstants";
import * as Haptics from "expo-haptics";
import { UserContext } from "../../store/user-context";

const ExpensesSummary = ({ expenses, periodName, useMoreSpace }) => {
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  if (!expenses || !periodName || userCtx.freshlyCreated) return <></>;

  const expensesSum = expenses.reduce((sum, expense) => {
    if (isNaN(Number(expense.calcAmount))) return sum;
    return sum + Number(expense.calcAmount);
  }, 0);
  // console.log("expensesSum ~ expensesSum", expensesSum);
  if (isNaN(Number(expensesSum))) {
    console.log("expensesSum is NaN");
    return <></>;
  }

  const userCurrency = tripCtx.tripCurrency;
  const expensesSumString = formatExpenseWithCurrency(
    expensesSum,
    userCurrency
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
  let budgetProgress = (expenseSumNum / budgetNumber) * 1;
  const budgetColor =
    budgetProgress <= 1
      ? GlobalStyles.colors.primary500
      : GlobalStyles.colors.error300;
  const unfilledColor =
    budgetProgress <= 1
      ? GlobalStyles.colors.gray600
      : GlobalStyles.colors.errorGrayed;

  if (budgetProgress > 1) budgetProgress -= 1;
  if (Number.isNaN(budgetProgress)) {
    console.log("NaN budgetProgress");
    return <></>;
  }

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
        "budget"
      )}: ${formatExpenseWithCurrency(budgetNumber, userCurrency)}`,
      text2:
        budgetNumber > expenseSumNum
          ? `${i18n.t("youHaveXLeftToSpend1")}${formatExpenseWithCurrency(
              budgetNumber - expenseSumNum,
              userCurrency
            )}${i18n.t("youHaveXLeftToSpend2")}`
          : `${i18n.t("exceededBudgetByX1")}${formatExpenseWithCurrency(
              expenseSumNum - budgetNumber,
              userCurrency
            )} !`,
      visibilityTime: 5000,
    });
  };

  return (
    <Pressable
      onPress={() => pressBudgetHandler()}
      style={({ pressed }) => [
        styles.container,
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
        width={useMoreSpace ? 300 : 150}
      />
    </Pressable>
  );
};

export default ExpensesSummary;

ExpensesSummary.propTypes = {
  expenses: PropTypes.array.isRequired,
  periodName: PropTypes.string.isRequired,
  useMoreSpace: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    padding: "2%",
    marginRight: "-4%",
  },
  sumTextContainer: {
    alignItems: "center",
  },
  sum: {
    fontSize: 32,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary500,
  },
});
