import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import { TripContext } from "../../store/trip-context";
import { formatExpenseString } from "../../util/string";
import PropTypes from "prop-types";

const ExpensesSummary = ({ expenses, periodName }) => {
  const tripCtx = useContext(TripContext);
  if (!expenses || !periodName) return <></>;

  const expensesSum = expenses.reduce((sum, expense) => {
    return sum + Number(expense.calcAmount);
  }, 0);
  // console.log("expensesSum ~ expensesSum", expensesSum);

  const expensesSumString = formatExpenseString(expensesSum);
  const userCurrency = tripCtx.tripCurrency;
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
    console.log("NaN budgetProgress passed to Summary");
    // alertYesNo(
    //   "Trip NaN Error",
    //   "Some Error probably made your Trip unreadable. Do you want to reset this account? (Create New Trip)",
    //   () => {
    //     userCtx.setFreshlyCreatedTo(true);
    //     authCtx.logout();
    //   },
    //   () => {
    //     authCtx.logout();
    //   }
    // );
    return <Text> Error: Not a Number </Text>;
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

ExpensesSummary.propTypes = {
  expenses: PropTypes.array.isRequired,
  periodName: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  container: {
    padding: "2%",
    marginRight: "-4%",
  },
  period: {
    fontSize: 12,
    color: GlobalStyles.colors.primary500,
  },
  sum: {
    fontSize: 30,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary500,
  },
});
