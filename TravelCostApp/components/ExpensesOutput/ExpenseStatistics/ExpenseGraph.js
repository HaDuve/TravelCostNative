import { StyleSheet, Text, View, FlatList } from "react-native";
import React, { useContext } from "react";
import { ExpensesContext } from "../../../store/expenses-context";
import {
  daysBetween,
  getDateMinusDays,
  getPreviousMondayDate,
  toDayMonth,
  toDayMonthString,
  toDayMonthString2,
  toMonthString,
  toShortFormat,
} from "../../../util/date";
import { UserContext } from "../../../store/user-context";
import { TripContext } from "../../../store/trip-context";
import { formatExpenseString } from "../../../util/string";
import { GlobalStyles } from "../../../constants/styles";

const ExpenseGraph = ({ expenses, periodName }) => {
  console.log("ExpenseGraph ~ periodName", periodName);
  const ExpenseCtx = useContext(ExpensesContext);
  const UserCtx = useContext(UserContext);
  const TripCtx = useContext(TripContext);
  const today = new Date();
  function renderItemRef() {}

  // list the last ?? and compare their respective expenseSum to their budget
  // day
  // week
  // month
  // year
  // total
  const listExpenseSumBudgets = [];
  switch (periodName) {
    case "day":
      const lastDays = 62;
      for (let i = 0; i < lastDays; i++) {
        const day = getDateMinusDays(today, i);
        const dayExpenses = ExpenseCtx.getDailyExpenses(i);
        const expensesSum = dayExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const dailyBudget = TripCtx.dailyBudget;
        const obj = { day, expensesSum, dailyBudget };
        listExpenseSumBudgets.push(obj);
      }
      renderItemRef = function renderItem({ item }) {
        let dayString = "";
        if (
          item.day.toDateString() === getDateMinusDays(today, 1).toDateString()
        ) {
          dayString = "Yesterday";
        } else if (item.day.toDateString() === new Date().toDateString()) {
          dayString = "Today";
        } else {
          dayString = toDayMonthString(item.day);
        }
        const debt = item.expensesSum > item.dailyBudget;
        const colorCoding = !debt ? styles.green : styles.red;
        const emptyValue = item.expensesSum === 0;
        const expenseString = emptyValue
          ? ""
          : formatExpenseString(item.expensesSum);

        return (
          <View style={styles.itemContainer}>
            <Text style={styles.text1}>{dayString}</Text>
            <Text style={[styles.text1, colorCoding]}>
              {expenseString}
              {emptyValue ? "-" : TripCtx.tripCurrency}
            </Text>
          </View>
        );
      };
      break;
    case "week":
      const lastWeeks = 24;
      for (let i = 0; i < lastWeeks; i++) {
        const { firstDay, lastDay, weeklyExpenses } =
          ExpenseCtx.getWeeklyExpenses(i);
        const expensesSum = weeklyExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const weeklyBudget = TripCtx.dailyBudget * 7;
        const obj = { firstDay, lastDay, expensesSum, weeklyBudget };
        listExpenseSumBudgets.push(obj);
      }
      renderItemRef = function renderItem({ item }) {
        let weekString = "";
        if (
          item.firstDay.toDateString() ===
          getPreviousMondayDate(getDateMinusDays(today, 7)).toDateString()
        ) {
          weekString = "Last Week";
        } else if (
          item.firstDay.toDateString() ===
          getPreviousMondayDate(new Date()).toDateString()
        ) {
          weekString = "This Week";
        } else {
          weekString = toDayMonthString2(item.firstDay, item.lastDay);
        }
        const debt = item.expensesSum > item.weeklyBudget;
        const colorCoding = !debt ? styles.green : styles.red;
        const emptyValue = item.expensesSum === 0;
        const expenseString = emptyValue
          ? ""
          : formatExpenseString(item.expensesSum);
        return (
          <View style={styles.itemContainer}>
            <Text style={styles.text1}>{weekString}</Text>
            <Text style={[styles.text1, colorCoding]}>
              {expenseString}
              {emptyValue ? "-" : TripCtx.tripCurrency}
            </Text>
          </View>
        );
      };
      break;
    case "month":
      const lastMonths = 24;
      for (let i = 0; i < lastMonths; i++) {
        const { firstDay, lastDay, monthlyExpenses } =
          ExpenseCtx.getMonthlyExpenses(i);
        const expensesSum = monthlyExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const monthlyBudget = TripCtx.dailyBudget * 30;
        const obj = { firstDay, lastDay, expensesSum, monthlyBudget };
        listExpenseSumBudgets.push(obj);
      }

      renderItemRef = function renderItem({ item }) {
        const month = toMonthString(item.firstDay);
        const debt = item.expensesSum > item.monthlyBudget;
        const colorCoding = !debt ? styles.green : styles.red;

        const emptyValue = item.expensesSum === 0;
        const expenseString = emptyValue
          ? ""
          : formatExpenseString(item.expensesSum);

        return (
          <View style={styles.itemContainer}>
            <Text style={styles.text1}>
              {month} {item.firstDay.getFullYear()}
            </Text>
            <Text style={[styles.text1, colorCoding]}>
              {expenseString}
              {emptyValue ? "-" : TripCtx.tripCurrency}
            </Text>
          </View>
        );
      };
      break;
    case "year":
      break;
    case "total":
      break;
    default:
      break;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listExpenseSumBudgets}
        renderItem={renderItemRef}
      ></FlatList>
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
    color: GlobalStyles.colors.primary500,
  },
  red: {
    color: GlobalStyles.colors.error300,
  },
});
