import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { ExpensesContext } from "../../../store/expenses-context";
import { toShortFormat } from "../../../util/date";

const ExpenseGraph = ({ expenses }) => {
  console.log("ExpenseGraph ~ expenses", expenses);
  const ExpenseCtx = useContext(ExpensesContext);
  const { firstDay, lastDay, monthlyExpenses } =
    ExpenseCtx.getMonthlyExpenses(0);
  console.log("ExpenseGraph ~ firstDay", toShortFormat(firstDay));
  console.log("ExpenseGraph ~ lastDay", toShortFormat(lastDay));
  console.log("ExpenseGraph ~ monthlyExpenses", monthlyExpenses);

  // const expensesSum = expenses.reduce((sum, expense) => {
  //   return sum + expense.amount;
  // }, 0);
  return (
    <View>
      <Text>6 Months ExpenseGraph</Text>
    </View>
  );
};

export default ExpenseGraph;

const styles = StyleSheet.create({});
