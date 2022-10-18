import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
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
import ExpenseChart from "../../ExpensesOverview/ExpenseChart";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ExpenseGraph = ({ expenses, periodName }) => {
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
  let xAxis = "";
  let yAxis = "";
  let budgetAxis = "";
  let budget = 0;
  let daysRange = 0;
  const lastDays = 35;
  const lastWeeks = 20;
  const lastMonths = 15;
  const lastYears = 10;

  switch (periodName) {
    case "day":
      xAxis = "day";
      yAxis = "expensesSum";
      budgetAxis = "dailyBudget";
      for (let i = 0; i < lastDays; i++) {
        const day = getDateMinusDays(today, i);
        const dayExpenses = ExpenseCtx.getDailyExpenses(i);
        const expensesSum = dayExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const dailyBudget = TripCtx.dailyBudget;
        budget = dailyBudget;
        daysRange = lastDays;
        const obj = { day, expensesSum, dailyBudget };
        listExpenseSumBudgets.push(obj);
      }
      renderItemRef = function renderItem({ item }) {
        let dayString = "";
        if (
          item.day.toDateString() === getDateMinusDays(today, 1).toDateString()
        ) {
          dayString = i18n.t("yesterday");
        } else if (item.day.toDateString() === new Date().toDateString()) {
          dayString = i18n.t("today");
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
      xAxis = "firstDay";
      yAxis = "expensesSum";
      budgetAxis = "weeklyBudget";

      for (let i = 0; i < lastWeeks; i++) {
        const { firstDay, lastDay, weeklyExpenses } =
          ExpenseCtx.getWeeklyExpenses(i);
        const expensesSum = weeklyExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const weeklyBudget = TripCtx.dailyBudget * 7;
        budget = weeklyBudget;
        daysRange = lastWeeks * 7;
        const obj = { firstDay, lastDay, expensesSum, weeklyBudget };
        listExpenseSumBudgets.push(obj);
      }
      renderItemRef = function renderItem({ item }) {
        let weekString = "";
        if (
          item.firstDay.toDateString() ===
          getPreviousMondayDate(getDateMinusDays(today, 7)).toDateString()
        ) {
          weekString = i18n.t("lastWeek");
        } else if (
          item.firstDay.toDateString() ===
          getPreviousMondayDate(new Date()).toDateString()
        ) {
          weekString = i18n.t("thisWeek");
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
      xAxis = "firstDay";
      yAxis = "expensesSum";
      budgetAxis = "monthlyBudget";

      for (let i = 0; i < lastMonths; i++) {
        const { firstDay, lastDay, monthlyExpenses } =
          ExpenseCtx.getMonthlyExpenses(i);
        const expensesSum = monthlyExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const monthlyBudget = TripCtx.dailyBudget * 30;
        budget = monthlyBudget;
        daysRange = lastMonths * 30;
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
      xAxis = "firstDay";
      yAxis = "expensesSum";
      budgetAxis = "yearlyBudget";

      for (let i = 0; i < lastYears; i++) {
        const { firstDay, lastDay, yearlyExpenses } =
          ExpenseCtx.getYearlyExpenses(i);
        const expensesSum = yearlyExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const yearlyBudget = TripCtx.dailyBudget * 365;
        budget = yearlyBudget;
        daysRange = lastYears * 365;
        const obj = { firstDay, lastDay, expensesSum, yearlyBudget };
        listExpenseSumBudgets.push(obj);
      }
      renderItemRef = function renderItem({ item }) {
        const yearString = item.firstDay.getFullYear();
        const debt = item.expensesSum > item.yearlyBudget;
        const colorCoding = !debt ? styles.green : styles.red;

        const emptyValue = item.expensesSum === 0;
        const expenseString = emptyValue
          ? ""
          : formatExpenseString(item.expensesSum);

        return (
          <View style={styles.itemContainer}>
            <Text style={styles.text1}>{yearString}</Text>
            <Text style={[styles.text1, colorCoding]}>
              {expenseString}
              {emptyValue ? "-" : TripCtx.tripCurrency}
            </Text>
          </View>
        );
      };
      break;
    case "total":
      return (
        <View
          style={{
            flex: 1,
            padding: 24,
          }}
        >
          <Text style={styles.text1}>{i18n.t("fallbackTimeFrame")}</Text>
        </View>
      );
      break;
    default:
      break;
  }
  return (
    <View style={styles.container}>
      <View>
        <FlatList
          ListHeaderComponent={
            <View style={styles.graphContainer}>
              <ExpenseChart
                inputData={listExpenseSumBudgets}
                xAxis={xAxis}
                yAxis={yAxis}
                budgetAxis={budgetAxis}
                budget={budget}
                daysRange={daysRange}
              ></ExpenseChart>
            </View>
          }
          data={listExpenseSumBudgets}
          renderItem={renderItemRef}
        ></FlatList>
      </View>
    </View>
  );
};

export default ExpenseGraph;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  graphContainer: {
    flex: 1,
  },
  itemContainer: {
    padding: 8,
    paddingHorizontal: 24,
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
