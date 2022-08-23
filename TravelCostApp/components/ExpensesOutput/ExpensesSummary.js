import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { GlobalStyles } from "./../../constants/styles";
import * as Progress from "react-native-progress";
import { UserContext } from "../../store/user-context";
import { TripContext } from "../../store/trip-context";

const ExpensesSummary = ({ expenses, periodName }) => {
  const expensesSum = expenses.reduce((sum, expense) => {
    return sum + expense.amount;
  }, 0);
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  let dailyBudgetNum = Number(userCtx.dailybudget);
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
  const budgetProgress = (expenseSumNum / dailyBudgetNum) * 1;

  return (
    <View style={styles.container}>
      <Text style={styles.sum}>${expensesSum.toFixed(2)}</Text>
      <Progress.Bar
        color={GlobalStyles.colors.primary500}
        unfilledColor={GlobalStyles.colors.gray600}
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
    fontSize: 24,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary500,
  },
});
