import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";

import React, { useContext, useRef } from "react";
import { ExpensesContext } from "../../../store/expenses-context";
import {
  getDateMinusDays,
  getPreviousMondayDate,
  toDayMonthString,
  toDayMonthString2,
  toMonthString,
} from "../../../util/date";
import { TripContext } from "../../../store/trip-context";
import { formatExpenseWithCurrency } from "../../../util/string";
import { GlobalStyles } from "../../../constants/styles";
import ExpenseChart from "../../ExpensesOverview/ExpenseChart";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import PropTypes from "prop-types";
import { isForeground } from "../../../util/appState";
import { MAX_JS_NUMBER } from "../../../confAppConstants";
import { SettingsContext } from "../../../store/settings-context";

const ExpenseGraph = ({
  periodName,
  periodRangeNumber,
  tripCtx,
  navigation,
}) => {
  // console.log("rerender ExpenseGraph - 2");
  const today = new Date();
  const renderItemRef = useRef(null);
  const expenseCtx = useContext(ExpensesContext);
  const { settings } = useContext(SettingsContext);
  const hideSpecial = settings.hideSpecialExpenses;

  if (!isForeground || !expenseCtx.expenses) {
    console.log("ExpenseGraph: not ready, return empty view");
    return <></>;
  }
  const totalBudget = Number(tripCtx.totalBudget) ?? MAX_JS_NUMBER;
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
          if (
            isNaN(Number(expense.calcAmount)) ||
            (hideSpecial && expense.isSpecialExpense)
          )
            return sum;
          return sum + Number(expense.calcAmount.toFixed(2));
        }, 0);
        const dailyBudget = tripCtx.dailyBudget;
        const formattedDay = toDayMonthString(day);
        const formattedSum = formatExpenseWithCurrency(
          expensesSum,
          tripCtx.tripCurrency
        );
        const label = `${formattedDay} - ${formattedSum}`;
        budget = Number(dailyBudget);
        daysRange = lastDays;
        const obj = { day, expensesSum, dailyBudget, label };
        listExpenseSumBudgets.push(obj);
      }
      renderItemRef.current = function renderItem({ item }) {
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
          : formatExpenseWithCurrency(item.expensesSum, tripCtx.tripCurrency);

        return (
          <Pressable
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
            onLongPress={() => {
              console.log("longPress");
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              const filteredExpenses = expenseCtx
                .getSpecificDayExpenses(new Date(item.day))
                .filter(
                  (item) =>
                    !item.isSpecialExpense ||
                    (item.isSpecialExpense && !hideSpecial)
                );
              if (!filteredExpenses || filteredExpenses.length === 0) return;
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: dayString,
              });
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const filteredExpenses = expenseCtx
                .getSpecificDayExpenses(new Date(item.day))
                .filter(
                  (item) =>
                    !item.isSpecialExpense ||
                    (item.isSpecialExpense && !hideSpecial)
                );
              if (!filteredExpenses || filteredExpenses.length === 0) return;
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
                {emptyValue ? "-" : ""}
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
          if (
            isNaN(Number(expense.calcAmount)) ||
            (hideSpecial && expense.isSpecialExpense)
          )
            return sum;
          return sum + Number(expense.calcAmount.toFixed(2));
        }, 0);
        let weeklyBudget = Number(tripCtx.dailyBudget) * 7;
        if (weeklyBudget > totalBudget) weeklyBudget = totalBudget;
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseWithCurrency(
          expensesSum,
          tripCtx.tripCurrency
        );
        const label = `${formattedDay} - ${formattedSum}`;
        budget = weeklyBudget;
        daysRange = lastWeeks * 7;
        const obj = { firstDay, lastDay, expensesSum, weeklyBudget, label };
        listExpenseSumBudgets.push(obj);
      }
      renderItemRef.current = function renderItem({ item }) {
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
          : formatExpenseWithCurrency(item.expensesSum, tripCtx.tripCurrency);
        return (
          <Pressable
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
            onLongPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              const filteredExpenses = expenseCtx
                .getSpecificWeekExpenses(new Date(item.firstDay))
                .filter(
                  (item) =>
                    !item.isSpecialExpense ||
                    (item.isSpecialExpense && !hideSpecial)
                );
              if (!filteredExpenses || filteredExpenses.length === 0) return;
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: weekString,
              });
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const filteredExpenses = expenseCtx
                .getSpecificWeekExpenses(new Date(item.firstDay))
                .filter(
                  (item) =>
                    !item.isSpecialExpense ||
                    (item.isSpecialExpense && !hideSpecial)
                );
              if (!filteredExpenses || filteredExpenses.length === 0) return;
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
                {emptyValue ? "-" : ""}
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
          if (
            isNaN(Number(expense.calcAmount)) ||
            (hideSpecial && expense.isSpecialExpense)
          )
            return sum;
          return sum + Number(expense.calcAmount.toFixed(2));
        }, 0);
        let monthlyBudget = Number(tripCtx.dailyBudget) * 30;
        if (monthlyBudget > totalBudget) monthlyBudget = totalBudget;
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseWithCurrency(
          expensesSum,
          tripCtx.tripCurrency
        );
        const label = `${formattedDay} - ${formattedSum}`;
        budget = monthlyBudget;
        daysRange = lastMonths * 30;
        const obj = { firstDay, lastDay, expensesSum, monthlyBudget, label };
        listExpenseSumBudgets.push(obj);
      }

      renderItemRef.current = function renderItem({ item }) {
        const month = toMonthString(item.firstDay);
        const debt = item.expensesSum > item.monthlyBudget;
        const colorCoding = !debt ? styles.green : styles.red;

        const emptyValue = item.expensesSum === 0;
        const expenseString = emptyValue
          ? ""
          : formatExpenseWithCurrency(item.expensesSum, tripCtx.tripCurrency);

        return (
          <Pressable
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
            onLongPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              const filteredExpenses = expenseCtx
                .getSpecificMonthExpenses(new Date(item.firstDay))
                .filter(
                  (item) =>
                    !item.isSpecialExpense ||
                    (item.isSpecialExpense && !hideSpecial)
                );
              if (!filteredExpenses || filteredExpenses.length === 0) return;
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: month,
              });
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const filteredExpenses = expenseCtx
                .getSpecificMonthExpenses(new Date(item.firstDay))
                .filter(
                  (item) =>
                    !item.isSpecialExpense ||
                    (item.isSpecialExpense && !hideSpecial)
                );
              if (!filteredExpenses || filteredExpenses.length === 0) return;
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
                {emptyValue ? "-" : ""}
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
          if (
            isNaN(Number(expense.calcAmount)) ||
            (hideSpecial && expense.isSpecialExpense)
          )
            return sum;
          return sum + Number(expense.calcAmount.toFixed(2));
        }, 0);

        let yearlyBudget = Number(tripCtx.dailyBudget) * 365;
        if (yearlyBudget > totalBudget) yearlyBudget = totalBudget;
        const formattedDay = toDayMonthString(firstDay);
        const formattedSum = formatExpenseWithCurrency(
          expensesSum,
          tripCtx.tripCurrency
        );
        const label = `${formattedDay} - ${formattedSum}`;
        budget = yearlyBudget;
        daysRange = lastYears * 365;
        const obj = { firstDay, lastDay, expensesSum, yearlyBudget, label };
        listExpenseSumBudgets.push(obj);
      }
      renderItemRef.current = function renderItem({ item }) {
        const yearString = item.firstDay.getFullYear();
        const debt = item.expensesSum > item.yearlyBudget;
        const colorCoding = !debt ? styles.green : styles.red;

        const emptyValue = item.expensesSum === 0;
        const expenseString = emptyValue
          ? ""
          : formatExpenseWithCurrency(item.expensesSum, tripCtx.tripCurrency);

        return (
          <Pressable
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
            onLongPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              const filteredExpenses = expenseCtx
                .getSpecificYearExpenses(new Date(item.firstDay))
                .filter(
                  (item) =>
                    !item.isSpecialExpense ||
                    (item.isSpecialExpense && !hideSpecial)
                );
              if (!filteredExpenses || filteredExpenses.length === 0) return;
              navigation.navigate("FilteredExpenses", {
                expenses: filteredExpenses,
                dayString: yearString,
              });
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const filteredExpenses = expenseCtx
                .getSpecificYearExpenses(new Date(item.firstDay))
                .filter(
                  (item) =>
                    !item.isSpecialExpense ||
                    (item.isSpecialExpense && !hideSpecial)
                );
              if (!filteredExpenses || filteredExpenses.length === 0) return;
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
                {emptyValue ? "-" : ""}
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
      <Animated.View
        entering={FadeInRight.duration(500)}
        exiting={FadeOutLeft.duration(500)}
        style={styles.listContainer}
      >
        <Animated.FlatList
          entering={FadeInRight.duration(500)}
          exiting={FadeOutLeft.duration(500)}
          data={listExpenseSumBudgets}
          renderItem={renderItemRef.current}
          ListHeaderComponent={
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
                expenses={expenseCtx.expenses}
              ></ExpenseChart>
            </View>
          }
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

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.periodName === nextProps.periodName &&
    prevProps.periodRangeNumber === nextProps.periodRangeNumber
  );
};

export default ExpenseGraph;

ExpenseGraph.propTypes = {
  navigation: PropTypes.object,
  expenses: PropTypes.array,
  periodName: PropTypes.string,
  periodRangeNumber: PropTypes.number,
  expenseCtx: PropTypes.object,
  tripCtx: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: 60,
    // paddingTop: 60,
  },
  graphContainer: {
    minHeight: 158,
    paddingTop: "15%",
    marginTop: "2.5%",
    paddingBottom: "5%",
    marginBottom: "5%",
  },
  listContainer: {
    flex: 1,
  },
  categoryCard: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 1,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 2.84,
      },
      android: {
        // elevation: 0,
        // borderRadius: 1000,
        // borderWidth: 1,
        // borderColor: GlobalStyles.colors.gray600,
        // marginHorizontal: 12,
        // marginVertical: 4,
      },
    }),
  },

  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginTop: 4,
    elevation: 8,
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
