import { StyleSheet, Text, View, FlatList } from "react-native";
import React, { useContext } from "react";
import { ExpensesContext } from "../../../store/expenses-context";
import { daysBetween, toMonthString, toShortFormat } from "../../../util/date";
import { UserContext } from "../../../store/user-context";

const ExpenseGraph = ({ expenses }) => {
  const ExpenseCtx = useContext(ExpensesContext);
  const UserCtx = useContext(UserContext);

  // list the last months and compare their respective expenseSum to their budget
  const listExpenseSumBudgets = [];
  const lastMonths = 12;
  for (let i = 0; i < lastMonths; i++) {
    const { firstDay, lastDay, monthlyExpenses } =
      ExpenseCtx.getMonthlyExpenses(i);
    const expensesSum = monthlyExpenses.reduce((sum, expense) => {
      return sum + expense.amount;
    }, 0);
    const monthlyBudget = UserCtx.dailybudget * 30;
    const obj = { firstDay, lastDay, expensesSum, monthlyBudget };
    listExpenseSumBudgets.push(obj);
  }

  function renderItem({ item }) {
    // const fday = toShortFormat(item.firstDay);
    // const lday = toShortFormat(item.lastDay);
    const month = toMonthString(item.firstDay);
    const debt = item.expensesSum > item.monthlyBudget;
    const colorCoding = !debt ? styles.green : styles.red;
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.text1}>
          {month} {item.firstDay.getFullYear()}
        </Text>
        <Text style={[styles.text1, colorCoding]}>
          {item.expensesSum.toFixed(2)}
          {UserCtx.homeCurrency}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <FlatList data={listExpenseSumBudgets} renderItem={renderItem}></FlatList>
    </View>
  );
};

export default ExpenseGraph;

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  itemContainer: {
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text1: {
    fontSize: 20,
  },
  green: {
    color: "green",
  },
  red: {
    color: "red",
  },
});
