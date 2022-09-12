import { StyleSheet, Text, View, FlatList } from "react-native";
import React, { useContext } from "react";
import { ExpensesContext } from "../../../store/expenses-context";
import { daysBetween, toMonthString, toShortFormat } from "../../../util/date";
import { UserContext } from "../../../store/user-context";

const ExpenseGraph = ({ expenses }) => {
  console.log("ExpenseGraph ~ expenses", expenses);
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

  console.log("ExpenseGraph ~ listExpenseSumBudgets", listExpenseSumBudgets);

  function renderItem({ item }) {
    // const fday = toShortFormat(item.firstDay);
    // const lday = toShortFormat(item.lastDay);
    const month = toMonthString(item.firstDay);

    console.log("renderItem ~ fday", item.firstDay);
    return (
      <View style={styles.itemContainer}>
        <Text>
          {month} {item.firstDay.getFullYear()}
        </Text>
        <Text>
          {item.expensesSum}$ / {item.monthlyBudget}$
        </Text>
      </View>
    );
    // return <Text>{item.expensesSum}</Text>;
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
    padding: 4,
  },
  itemContainer: {
    padding: 4,
  },
});
