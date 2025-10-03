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
import { formatExpenseWithCurrency } from "../../../util/string";
import { GlobalStyles } from "../../../constants/styles";
import ExpenseChart from "../../ExpensesOverview/ExpenseChart";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import PropTypes from "prop-types";
import { isForeground } from "../../../util/appState";
import { MAX_JS_NUMBER, MAX_PERIOD_RANGE } from "../../../confAppConstants";
import { SettingsContext } from "../../../store/settings-context";
import { getExpensesSumPeriod } from "../../../util/expense";
import FlatButton from "../../UI/FlatButton";
import { dynamicScale } from "../../../util/scalingUtil";
import { OrientationContext } from "../../../store/orientation-context";

const ExpenseGraph = ({
  periodName,
  periodRangeNumber,
  longerPeriodNum,
  setLongerPeriodNum,
  startingPoint,
  setStartingPoint,
  tripCtx,
  navigation,
}) => {
  const today = new Date();
  const renderItemRef = useRef(null);
  const { isPortrait } = useContext(OrientationContext);

  const expenseCtx = useContext(ExpensesContext);
  const { settings } = useContext(SettingsContext);
  const hideSpecial = settings.hideSpecialExpenses;

  if (!isForeground || !expenseCtx.expenses) {
    return <></>;
  }

  const totalBudget = Number(tripCtx.totalBudget) ?? MAX_JS_NUMBER;
  const listExpenseSumBudgets = [];
  const lastDays = (periodRangeNumber ?? 7) + longerPeriodNum;
  const lastWeeks = (periodRangeNumber ?? 7) + longerPeriodNum;
  const lastMonths = (periodRangeNumber ?? 7) + longerPeriodNum;
  const lastYears =
    (periodName == "total" ? 5 : periodRangeNumber ?? 7) + longerPeriodNum;
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
      for (let i = startingPoint; i < lastDays; i++) {
        const day = getDateMinusDays(today, i);
        const dayExpenses = expenseCtx.getDailyExpenses(i);
        const expensesSum = getExpensesSumPeriod(dayExpenses, hideSpecial);
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
          (item.day instanceof Date
            ? item.day.toDateString()
            : item.day.toString()) ===
          (() => {
            const date = getDateMinusDays(today, 1);
            return date instanceof Date
              ? date.toDateString()
              : date.toJSDate().toDateString();
          })()
        ) {
          dayString = i18n.t("yesterday");
        } else if (
          (item.day instanceof Date
            ? item.day.toDateString()
            : item.day.toString()) === new Date().toDateString()
        ) {
          dayString = i18n.t("today");
        } else {
          dayString = toDayMonthString(item.day);
        }
        const titleStringFilteredPieCharts = `${dayString} - ${formatExpenseWithCurrency(
          item.expensesSum,
          tripCtx.tripCurrency
        )}`;
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
              // console.log("longPress");
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
              // if (!filteredExpenses || filteredExpenses?.length === 0) return;

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
              // if (!filteredExpenses || filteredExpenses?.length === 0) return;
              navigation.navigate("FilteredPieCharts", {
                expenses: filteredExpenses,
                dayString: titleStringFilteredPieCharts,
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

      for (let i = startingPoint; i < lastWeeks; i++) {
        const { firstDay, lastDay, weeklyExpenses } =
          expenseCtx.getWeeklyExpenses(i);
        const expensesSum = getExpensesSumPeriod(weeklyExpenses, hideSpecial);
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
          (item.firstDay instanceof Date
            ? item.firstDay.toDateString()
            : item.firstDay.toString()) ===
          (() => {
            const date = getPreviousMondayDate(getDateMinusDays(today, 7));
            return date instanceof Date
              ? date.toDateString()
              : date.toJSDate().toDateString();
          })()
        ) {
          weekString = i18n.t("lastWeek");
        } else if (
          (item.firstDay instanceof Date
            ? item.firstDay.toDateString()
            : item.firstDay.toString()) ===
          (() => {
            const date = getPreviousMondayDate(new Date());
            return date instanceof Date
              ? date.toDateString()
              : date.toJSDate().toDateString();
          })()
        ) {
          weekString = i18n.t("thisWeek");
        } else {
          weekString = toDayMonthString2(item.firstDay, item.lastDay);
        }
        const titleStringFilteredPieCharts = `${weekString} - ${formatExpenseWithCurrency(
          item.expensesSum,
          tripCtx.tripCurrency
        )}`;
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
              // if (!filteredExpenses || filteredExpenses?.length === 0) return;
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
              // if (!filteredExpenses || filteredExpenses?.length === 0) return;
              navigation.navigate("FilteredPieCharts", {
                expenses: filteredExpenses,
                dayString: titleStringFilteredPieCharts,
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

      for (let i = startingPoint; i < lastMonths; i++) {
        const { firstDay, lastDay, monthlyExpenses } =
          expenseCtx.getMonthlyExpenses(i);
        const expensesSum = getExpensesSumPeriod(monthlyExpenses, hideSpecial);
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
        const titleStringFilteredPieCharts = `${month} - ${formatExpenseWithCurrency(
          item.expensesSum,
          tripCtx.tripCurrency
        )}`;
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
              // if (!filteredExpenses || filteredExpenses?.length === 0) return;
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
              // if (!filteredExpenses || filteredExpenses?.length === 0) return;
              navigation.navigate("FilteredPieCharts", {
                expenses: filteredExpenses,
                dayString: titleStringFilteredPieCharts,
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

      for (let i = startingPoint; i < lastYears; i++) {
        const { firstDay, lastDay, yearlyExpenses } =
          expenseCtx.getYearlyExpenses(i);
        const expensesSum = getExpensesSumPeriod(yearlyExpenses, hideSpecial);
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
        const titleStringFilteredPieCharts = `${yearString} - ${formatExpenseWithCurrency(
          item.expensesSum,
          tripCtx.tripCurrency
        )}`;
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
              // if (!filteredExpenses || filteredExpenses?.length === 0) return;
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
              // if (!filteredExpenses || filteredExpenses?.length === 0) return;
              navigation.navigate("FilteredPieCharts", {
                expenses: filteredExpenses,
                dayString: titleStringFilteredPieCharts,
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
  const showFutureString = `${i18n.t("showMore")} ${i18n.t("future")} ${i18n.t(
    periodName + "s"
  )}`;

  const showPastString = `${i18n.t("showMore")} ${i18n.t("past")} ${i18n.t(
    periodName + "s"
  )}`;

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
        {!isPortrait && (
          <View style={styles.graphContainer}>
            <ExpenseChart
              inputData={listExpenseSumBudgets}
              xAxis={xAxis}
              yAxis={yAxis}
              budget={budget}
              currency={tripCtx.tripCurrency}
            ></ExpenseChart>
          </View>
        )}
        <Animated.FlatList
          entering={FadeInRight.duration(500)}
          exiting={FadeOutLeft.duration(500)}
          data={listExpenseSumBudgets}
          renderItem={renderItemRef.current}
          ListHeaderComponent={
            <View
              style={[
                styles.graphContainer,
                !isPortrait && styles.landscapeGraphContainer,
              ]}
            >
              {isPortrait && (
                <ExpenseChart
                  inputData={listExpenseSumBudgets}
                  xAxis={xAxis}
                  yAxis={yAxis}
                  budget={budget}
                  currency={tripCtx.tripCurrency}
                ></ExpenseChart>
              )}

              <View
                style={[
                  isPortrait && styles.flatButtonContainer,
                  !isPortrait && styles.landscapeFlatButton,
                ]}
              >
                {startingPoint > -MAX_PERIOD_RANGE && (
                  <FlatButton
                    onPress={() => {
                      // reduce starting point to show future expenses
                      setStartingPoint(
                        startingPoint - (periodRangeNumber ?? 10)
                      );
                    }}
                    textStyle={styles.text1}
                  >
                    {showFutureString}
                  </FlatButton>
                )}
              </View>
            </View>
          }
          ListFooterComponent={
            <View style={{ height: dynamicScale(200, true) }}>
              <View style={styles.flatButtonContainer}>
                {longerPeriodNum < MAX_PERIOD_RANGE && (
                  <FlatButton
                    onPress={() => {
                      // reduce starting point to show future expenses
                      setLongerPeriodNum(longerPeriodNum + 10);
                    }}
                    textStyle={styles.text1}
                  >
                    {showPastString}
                  </FlatButton>
                )}
              </View>
            </View>
          }
          removeClippedSubviews={true}
          // maxToRenderPerBatch={7}
          updateCellsBatchingPeriod={300}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          // windowSize={7}
          getItemLayout={(data, index) => ({
            length: dynamicScale(65, true),
            offset: dynamicScale(65, true) * index,
            index,
          })}
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
  expenseCtx: PropTypes.object,
  tripCtx: PropTypes.object,
  longerPeriodNum: PropTypes.number,
  setLongerPeriodNum: PropTypes.func,
  startingPoint: PropTypes.number,
  setStartingPoint: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: 60,
    // paddingTop: 60,
  },
  graphContainer: {
    minHeight: dynamicScale(158, true),
    paddingTop: dynamicScale(45, true),
    marginTop: dynamicScale(8, true),
    paddingBottom: dynamicScale(15, true),
    marginBottom: dynamicScale(15, true),
  },
  landscapeGraphContainer: {
    minHeight: 0,
    paddingTop: 0,
    marginTop: 0,
    paddingBottom: 0,
  },
  flatButtonContainer: {
    marginBottom: dynamicScale(-30, true),
  },
  landscapeFlatButton: {
    marginTop: dynamicScale(48, true),
    // marginBottom: dynamicScale(20, true),
  },
  listContainer: {
    flex: 1,
    flexDirection: "row",
  },
  categoryCard: {
    height: dynamicScale(65, true),
    minWidth: dynamicScale(200),
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
    paddingVertical: dynamicScale(12, true),
    paddingHorizontal: dynamicScale(24),
    marginHorizontal: dynamicScale(20),
    marginTop: dynamicScale(4, true),
    ...Platform.select({
      android: {
        elevation: 5,
        borderRadius: 10,
      },
    }),
    marginBottom: dynamicScale(8, true),
    borderRadius: dynamicScale(10, false, 0.5),
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  text1: {
    fontSize: dynamicScale(20, false, 0.5),
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
