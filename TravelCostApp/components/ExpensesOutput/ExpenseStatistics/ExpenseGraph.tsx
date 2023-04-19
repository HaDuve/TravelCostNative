import { StyleSheet, Text, View, Pressable } from "react-native";
import * as Haptics from "expo-haptics";

import React, { useContext } from "react";
import { ExpensesContext } from "../../../store/expenses-context";
import {
  getDateMinusDays,
  getPreviousMondayDate,
  toDayMonthString,
  toDayMonthString2,
  toMonthString,
} from "../../../util/date";
import { TripContext } from "../../../store/trip-context";
import { formatExpenseString } from "../../../util/string";
import { GlobalStyles } from "../../../constants/styles";
import ExpenseChart from "../../ExpensesOverview/ExpenseChart";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import PropTypes from "prop-types";
import getSymbolFromCurrency from "currency-symbol-map";
import { isForeground } from "../../../util/appState";
import Toast from "react-native-toast-message";

const ExpenseGraph = ({ periodName, periodRangeNumber, navigation }) => {
  const expenseCtx = useContext(ExpensesContext);
  const tripCtx = useContext(TripContext);
  const today = new Date();
  function renderItemRef() {
    return <></>;
  }
  if (!isForeground) {
    console.log("ExpenseGraph: not in foreground, return empty view");
    return <></>;
  }
  const listExpenseSumBudgets = [];
  const lastDays = periodRangeNumber ?? 8,
    lastWeeks = periodRangeNumber ?? 10,
    lastMonths = periodRangeNumber ?? 10,
    lastYears = periodName == "total" ? 5 : periodRangeNumber ?? 10;
  let xAxis = "";
  let yAxis = "";
  let budgetAxis = "";
  let budget = 0;
  let daysRange = 0;
  switch (periodName) {
    case "day":
      xAxis = "day";
      yAxis = "expensesSum";
      budgetAxis = "dailyBudget";
      for (let i = 0; i < lastDays; i++) {
        const day = getDateMinusDays(today, i);
        const dayExpenses = expenseCtx.getDailyExpenses(i);
        const expensesSum = dayExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const dailyBudget = tripCtx.dailyBudget;
        const formattedDay = toDayMonthString(day);
        const formattedSum = formatExpenseString(expensesSum);
        const label = `${formattedDay} - ${formattedSum}${getSymbolFromCurrency(
          tripCtx.tripCurrency
        )}`;
        budget = Number(dailyBudget);
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
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
            onLongPress={() => {
              console.log("longPress");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const filteredExpenses = expenseCtx.getSpecificDayExpenses(
                new Date(item.day)
              );
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: dayString,
              });
            }}
            onPress={() => {
              const filteredExpenses = expenseCtx.getSpecificDayExpenses(
                new Date(item.day)
              );
              navigation.navigate("FilteredPieCharts", {
                expenses: filteredExpenses,
                dayString: dayString,
              });
            }}
          >
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutLeft}
              style={styles.itemContainer}
            >
              <Text style={styles.text1}>{dayString}</Text>
              <Text style={[styles.text1, colorCoding]}>
                {expenseString}
                {emptyValue ? "-" : getSymbolFromCurrency(tripCtx.tripCurrency)}
              </Text>
            </Animated.View>
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
          expenseCtx.getWeeklyExpenses(i);
        const expensesSum = weeklyExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const weeklyBudget = Number(tripCtx.dailyBudget) * 7;
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseString(expensesSum);
        const label = `${formattedDay} - ${formattedSum}${getSymbolFromCurrency(
          tripCtx.tripCurrency
        )}`;
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
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const filteredExpenses = expenseCtx.getSpecificWeekExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: weekString,
              });
            }}
            onPress={() => {
              const filteredExpenses = expenseCtx.getSpecificWeekExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredPieCharts", {
                expenses: filteredExpenses,
                dayString: weekString,
              });
            }}
          >
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutLeft}
              style={styles.itemContainer}
            >
              <Text style={styles.text1}>{weekString}</Text>
              <Text style={[styles.text1, colorCoding]}>
                {expenseString}
                {emptyValue ? "-" : getSymbolFromCurrency(tripCtx.tripCurrency)}
              </Text>
            </Animated.View>
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
          expenseCtx.getMonthlyExpenses(i);
        const expensesSum = monthlyExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const monthlyBudget = Number(tripCtx.dailyBudget) * 30;
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseString(expensesSum);
        const label = `${formattedDay} - ${formattedSum}${getSymbolFromCurrency(
          tripCtx.tripCurrency
        )}`;
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
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const filteredExpenses = expenseCtx.getSpecificMonthExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: month,
              });
            }}
            onPress={() => {
              const filteredExpenses = expenseCtx.getSpecificMonthExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredPieCharts", {
                expenses: filteredExpenses,
                dayString: month,
              });
            }}
          >
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutLeft}
              style={styles.itemContainer}
            >
              <Text style={styles.text1}>
                {month} {item.firstDay.getFullYear()}
              </Text>
              <Text style={[styles.text1, colorCoding]}>
                {expenseString}
                {emptyValue ? "-" : getSymbolFromCurrency(tripCtx.tripCurrency)}
              </Text>
            </Animated.View>
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
          expenseCtx.getYearlyExpenses(i);
        const expensesSum = yearlyExpenses.reduce((sum, expense) => {
          return sum + expense.calcAmount;
        }, 0);
        const yearlyBudget = Number(tripCtx.dailyBudget) * 365;
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseString(expensesSum);
        const label = `${formattedDay} - ${formattedSum}${getSymbolFromCurrency(
          tripCtx.tripCurrency
        )}`;
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
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const filteredExpenses = expenseCtx.getSpecificYearExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: yearString,
              });
            }}
            onPress={() => {
              const filteredExpenses = expenseCtx.getSpecificYearExpenses(
                new Date(item.firstDay)
              );
              navigation.navigate("FilteredPieCharts", {
                expenses: filteredExpenses,
                dayString: yearString,
              });
            }}
          >
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutLeft}
              style={styles.itemContainer}
            >
              <Text style={styles.text1}>{yearString}</Text>
              <Text style={[styles.text1, colorCoding]}>
                {expenseString}
                {emptyValue ? "-" : getSymbolFromCurrency(tripCtx.tripCurrency)}
              </Text>
            </Animated.View>
          </Pressable>
        );
      };
      break;
    default:
      break;
  }

  return (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
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
          currency={tripCtx.tripCurrency}
          navigation={navigation}
        ></ExpenseChart>
      </View>
      {/* <View style={styles.shadow}></View> */}
      <Animated.View
        entering={FadeInRight.duration(500)}
        exiting={FadeOutLeft.duration(500)}
        style={styles.listContainer}
      >
        <Animated.FlatList
          entering={FadeInRight.duration(500)}
          exiting={FadeOutLeft.duration(500)}
          data={listExpenseSumBudgets}
          renderItem={renderItemRef}
          ListFooterComponent={<View style={{ height: 100 }}></View>}
          // removeClippedSubviews={true}
          // maxToRenderPerBatch={7}
          // updateCellsBatchingPeriod={300}
          // initialNumToRender={7}
          // windowSize={7}
          // getItemLayout={(data, index) => ({
          //   length: 50,
          //   offset: 50 * index,
          //   index,
          // })}
        ></Animated.FlatList>
      </Animated.View>
    </Animated.View>
  );
};

export default ExpenseGraph;

ExpenseGraph.propTypes = {
  navigation: PropTypes.object,
  expenses: PropTypes.array,
  periodName: PropTypes.string,
  periodRangeNumber: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  graphContainer: {
    minHeight: 158,
    paddingTop: "5%",
    marginTop: "2.5%",
    paddingBottom: "5%",
    marginBottom: "5%",
  },
  listContainer: {
    flex: 1,
  },
  categoryCard: {
    shadowColor: "#000",
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2.84,
    elevation: 5,
  },

  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  text1: {
    fontSize: 20,
    color: GlobalStyles.colors.textColor,
    fontWeight: "300",
  },
  green: {
    color: GlobalStyles.colors.primary500,
  },
  red: {
    color: GlobalStyles.colors.error300,
  },
  shadow: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderBottomColor: GlobalStyles.colors.gray600,
    minHeight: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 2,
  },
});
