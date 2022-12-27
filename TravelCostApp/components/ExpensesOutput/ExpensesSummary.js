import { Alert, StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect } from "react";
import { GlobalStyles } from "./../../constants/styles";
import * as Progress from "react-native-progress";
import { UserContext } from "../../store/user-context";
import { TripContext } from "../../store/trip-context";
import { formatExpenseString } from "../../util/string";
import { AuthContext } from "../../store/auth-context";
import { alertNoYes } from "../Errors/Alert";

const ExpensesSummary = ({ expenses, periodName }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const expensesSum = expenses.reduce((sum, expense) => {
    return sum + expense.calcAmount;
  }, 0);

  const expensesSumString = formatExpenseString(expensesSum);
  const userCurrency = tripCtx.tripCurrency;
  if (tripCtx.tripid === "")
    return (
      <View style={styles.container}>
        <Text style={[styles.sum, { color: budgetColor }]}>
          {expensesSumString}
          {userCurrency}
        </Text>
      </View>
    );
  let dailyBudgetNum = Number(tripCtx.dailyBudget);
  const expenseSumNum = Number(expensesSum);
  const totalBudget = Number(tripCtx.totalBudget);
  //TODO: change the dailybudget system to make calculating this unified
  let budgetMult = 1;
  switch (periodName) {
    case "day":
      break;
    case "week":
      budgetMult = 7;
      dailyBudgetNum = dailyBudgetNum * budgetMult;
      break;
    case "month":
      budgetMult = 30;
      dailyBudgetNum = dailyBudgetNum * budgetMult;

      break;
    case "year":
      budgetMult = 365;
      dailyBudgetNum = dailyBudgetNum * budgetMult;
      break;
    case "total":
      dailyBudgetNum = totalBudget;
      break;
    default:
      break;
  }

  let budgetProgress = (expenseSumNum / dailyBudgetNum) * 1;
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
    console.error("NaN budgetProgress passed to Summary");
    alertNoYes(
      "Trip NaN Error",
      "Some Error probably made your Trip unreadable. Do you want to reset this account? (Create New Trip)",
      authCtx.logout(),
      () => {
        userCtx.setFreshlyCreatedTo(true);
        authCtx.logout();
      }
    );
    return <Text> Error: Number is NAN </Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sum, { color: budgetColor }]}>
        {expensesSumString}
        {userCurrency}
      </Text>
      <Progress.Bar
        color={budgetColor}
        unfilledColor={unfilledColor}
        borderWidth={0}
        borderRadius={8}
        progress={budgetProgress}
        height={12}
        width={150}
      />
    </View>
  );
};

export default ExpensesSummary;

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 6,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  period: {
    fontSize: 12,
    color: GlobalStyles.colors.primary500,
  },
  sum: {
    fontSize: 34,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary500,
  },
});
