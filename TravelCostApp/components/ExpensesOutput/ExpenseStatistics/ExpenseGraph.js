import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  Dimensions,
  Pressable,
} from "react-native";
import React, { memo, useContext, useCallback } from "react";
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
import Animated, {
  FadeInRight,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ExpenseGraph = ({ expenses, periodName, navigation }) => {
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
  const lastDays = 15;
  const lastWeeks = 15;
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
        let expensesSum = dayExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const dailyBudget = TripCtx.dailyBudget;
        const formattedDay = toDayMonthString(day);
        const formattedSum = formatExpenseString(expensesSum);
        const label = `${formattedDay} - ${formattedSum}${TripCtx.tripCurrency}`;
        budget = dailyBudget;
        daysRange = lastDays;
        const obj = { day, expensesSum, dailyBudget, label };
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
          <Pressable
            onPress={() => {
              const filteredExpenses = ExpenseCtx.getSpecificDayExpenses(
                new Date(item.day)
              );
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: dayString,
              });
            }}
            style={styles.itemContainer}
          >
            <Text style={styles.text1}>{dayString}</Text>
            <Text style={[styles.text1, colorCoding]}>
              {expenseString}
              {emptyValue ? "-" : TripCtx.tripCurrency}
            </Text>
          </Pressable>
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
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseString(expensesSum);
        const label = `${formattedDay} - ${formattedSum}${TripCtx.tripCurrency}`;
        budget = weeklyBudget;
        daysRange = lastWeeks * 7;
        const obj = { firstDay, lastDay, expensesSum, weeklyBudget, label };
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
          <Pressable
            onPress={() => {
              const filteredExpenses = ExpenseCtx.getSpecificWeekExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: weekString,
              });
            }}
            style={styles.itemContainer}
          >
            <Text style={styles.text1}>{weekString}</Text>
            <Text style={[styles.text1, colorCoding]}>
              {expenseString}
              {emptyValue ? "-" : TripCtx.tripCurrency}
            </Text>
          </Pressable>
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
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseString(expensesSum);
        const label = `${formattedDay} - ${formattedSum}${TripCtx.tripCurrency}`;
        budget = monthlyBudget;
        daysRange = lastMonths * 30;
        const obj = { firstDay, lastDay, expensesSum, monthlyBudget, label };
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
          <Pressable
            onPress={() => {
              const filteredExpenses = ExpenseCtx.getSpecificMonthExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: month,
              });
            }}
            style={styles.itemContainer}
          >
            <Text style={styles.text1}>
              {month} {item.firstDay.getFullYear()}
            </Text>
            <Text style={[styles.text1, colorCoding]}>
              {expenseString}
              {emptyValue ? "-" : TripCtx.tripCurrency}
            </Text>
          </Pressable>
        );
      };
      break;
    case "total":
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
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseString(expensesSum);
        const label = `${formattedDay} - ${formattedSum}${TripCtx.tripCurrency}`;
        budget = yearlyBudget;
        daysRange = lastYears * 365;
        const obj = { firstDay, lastDay, expensesSum, yearlyBudget, label };
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
          <Pressable
            onPress={() => {
              const filteredExpenses = ExpenseCtx.getSpecificYearExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: yearString,
              });
            }}
            style={styles.itemContainer}
          >
            <Text style={styles.text1}>{yearString}</Text>
            <Text style={[styles.text1, colorCoding]}>
              {expenseString}
              {emptyValue ? "-" : TripCtx.tripCurrency}
            </Text>
          </Pressable>
        );
      };
      break;
    default:
      break;
  }
  return (
    <Animated.View
      entering={FadeInRight.duration(1000)}
      exiting={FadeOutLeft.duration(1000)}
      style={styles.container}
    >
      {/* ListHeaderComponent={ */}
      <View style={styles.graphContainer}>
        <ExpenseChart
          inputData={listExpenseSumBudgets}
          xAxis={xAxis}
          yAxis={yAxis}
          budgetAxis={budgetAxis}
          budget={budget}
          daysRange={daysRange}
          currency={TripCtx.tripCurrency}
        ></ExpenseChart>
      </View>
      {/* } */}
      <View style={styles.listContainer}>
        <FlatList
          data={listExpenseSumBudgets}
          renderItem={renderItemRef}
          removeClippedSubviews={true}
          maxToRenderPerBatch={7}
          updateCellsBatchingPeriod={300}
          initialNumToRender={7}
          windowSize={7}
          getItemLayout={(data, index) => ({
            length: 50,
            offset: 50 * index,
            index,
          })}
        ></FlatList>
      </View>
    </Animated.View>
  );
};

export default ExpenseGraph;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  graphContainer: {
    minHeight: 158,
    paddingTop: "5%",
    paddingBottom: "5%",
  },
  listContainer: {
    flex: 1,
  },
  itemContainer: {
    padding: 8,
    marginBottom: 8,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    // card shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
    paddingBottom: 8,
    marginHorizontal: 20,
    marginVertical: 4,
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
