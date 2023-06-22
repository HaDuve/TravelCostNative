import React, { memo } from "react";
import { StyleSheet, Vibration, View } from "react-native";
import * as Haptics from "expo-haptics";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { GlobalStyles } from "../../constants/styles";
import {
  getDateMinusDays,
  getDatePlusDays,
  toDayMonthString,
} from "../../util/date";
import PropTypes from "prop-types";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { formatExpenseWithCurrency } from "../../util/string";
import { isSameDay } from "../../util/dateTime";
import { Toast } from "react-native-toast-message/lib/src/Toast";

const ExpenseChart = ({
  inputData,
  xAxis,
  yAxis,
  budget,
  daysRange,
  currency,
  navigation,
  expenses,
}) => {
  // console.log("rerender ExpenseChart - 3");
  const data = inputData;
  // console last day
  const firstItem = inputData[0];
  const [lastItem] = inputData.slice(-1);
  const lastItemDate = new Date(firstItem.day ?? firstItem.firstDay);

  const firstItemDate = getDateMinusDays(
    new Date(lastItem.day ?? lastItem.lastDay),
    1
  );
  // console.log("firstItemDate:", firstItemDate);
  // console.log("lastItemDate:", lastItemDate);
  const xAxisString = xAxis;
  const yAxisString = yAxis;
  const budgetCompare =
    inputData[0]?.dailyBudget ||
    inputData[0]?.weeklyBudget ||
    inputData[0]?.monthlyBudget ||
    inputData[0]?.yearlyBudget;
  inputData?.forEach((obj) => {
    if (obj.expensesSum > budgetCompare) {
      obj.fill = GlobalStyles.colors.error300;
    } else {
      if (obj.expensesSum > 0) {
        obj.fill = GlobalStyles.colors.primary500;
      }
    }
  });
  // cap expensesSum at 5*dailyBudget 5*weeklyBudget 5*monthlyBudget 5*yearlyBudget respectively
  // const CAP = 100;
  // inputData?.forEach((obj) => {
  //   if (obj.expensesSum > CAP * obj.yearlyBudget) {
  //     obj.expensesSum = CAP * obj.yearlyBudget;
  //   }
  //   if (obj.expensesSum > CAP * obj.monthlyBudget) {
  //     obj.expensesSum = CAP * obj.monthlyBudget;
  //   }
  //   if (obj.expensesSum > CAP * obj.weeklyBudget) {
  //     obj.expensesSum = CAP * obj.weeklyBudget;
  //   }
  //   if (obj.expensesSum > CAP * obj.dailyBudget) {
  //     obj.expensesSum = CAP * obj.dailyBudget;
  //   }
  // });

  return (
    <View style={styles.container}>
      <VictoryChart
        domain={{ x: [firstItemDate, lastItemDate] }}
        height={160}
        animate={{
          duration: 1000,
          onLoad: { duration: 1000 },
        }}
        padding={{ top: 10, bottom: 30, left: 60, right: 30 }}
        domainPadding={{ x: [0, 20] }}
        containerComponent={
          // daysRange < 10 ? (
          <VictoryVoronoiContainer voronoiDimension="x" />
          // ) : (
          // <VictoryContainer responsive={false} />
          // )
        }
      >
        <VictoryAxis dependentAxis={true} />
        <VictoryAxis
          tickCount={4}
          tickFormat={(x) => {
            // return x label as a DD MMM format
            const date = new Date(x);
            const day = date.toLocaleString("default", { day: "2-digit" });
            const month = date.toLocaleString("default", { month: "short" });
            return `${day} ${month}`;
          }}
        />
        <VictoryLine
          domain={{ x: [firstItemDate, lastItemDate] }}
          labelComponent={
            <VictoryTooltip
              center={{ x: 210, y: 26 }}
              constrainToVisibleArea
              renderInPortal={false}
            />
          }
          data={[
            {
              // first point
              x: firstItemDate,
              y: Number(budget),
              // label: `Budget: ${budget} ${getCurrencySymbol(currency)}`,
            },
            {
              x: lastItemDate,
              y: Number(budget),
              // label: `Budget: ${budget} ${getCurrencySymbol(currency)}`,
            },
          ]}
          style={{
            data: {
              stroke: GlobalStyles.colors.gray700,
              strokeWidth: 1,
            },
          }}
        />
        <VictoryBar
          labelComponent={
            <VictoryTooltip
              center={{ x: 212, y: 14 }}
              renderInPortal={false}
              constrainToVisibleArea
            />
          }
          style={{
            data: {
              fill: ({ datum, active }) =>
                active ? GlobalStyles.colors.gray500 : datum.fill,
              strokeWidth: ({ active }) => (active ? 1 : 0),
              stroke: ({ active }) =>
                active ? GlobalStyles.colors.gray700 : "",
            },
          }}
          data={data}
          x={xAxisString}
          y={yAxisString}
          events={[
            {
              target: "data",
              eventHandlers: {
                onPress: () => {
                  return [
                    {
                      target: "data",
                      mutation: ({ datum }) => {
                        console.log(datum);
                        const budget =
                          datum.dailyBudget ||
                          datum.weeklyBudget ||
                          datum.monthlyBudget ||
                          datum.yearlyBudget;
                        const overUnder = budget - datum.expensesSum;
                        const overUnderBool = overUnder > 0;
                        const overUnderString = overUnderBool
                          ? `${i18n.t(
                              "underBudget"
                            )} ${formatExpenseWithCurrency(
                              overUnder,
                              currency
                            )}`
                          : `${i18n.t(
                              "overBudget"
                            )} ${formatExpenseWithCurrency(
                              +overUnder * -1,
                              currency
                            )}`;
                        Toast.show({
                          type: overUnderBool ? "success" : "error",
                          text1: `${datum.label}`,
                          text2: overUnderString,
                        });
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      },
                    },
                  ];
                },
                onLongPress: () => {
                  return [
                    {
                      target: "data",
                      mutation: ({ datum }) => {
                        console.log(datum);
                        let filteredExpenses = [];
                        if (datum.firstDay && datum.lastDay) {
                          filteredExpenses = expenses.filter(
                            (expense) =>
                              expense.date >= datum.firstDay &&
                              expense.date <= datum.lastDay
                          );
                        } else if (datum.day) {
                          filteredExpenses = expenses.filter((expense) =>
                            isSameDay(expense.date, datum.day)
                          );
                        }
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success
                        );
                        navigation.navigate("FilteredPieCharts", {
                          expenses: filteredExpenses,
                          dayString: `${datum.label}`,
                        });
                      },
                    },
                  ];
                },
              },
            },
          ]}
        />
      </VictoryChart>
    </View>
  );
};

export default ExpenseChart;

ExpenseChart.propTypes = {
  inputData: PropTypes.array,
  xAxis: PropTypes.string,
  yAxis: PropTypes.string,
  budgetAxis: PropTypes.string,
  budget: PropTypes.number,
  daysRange: PropTypes.number,
  currency: PropTypes.string,
  navigation: PropTypes.object,
  expenses: PropTypes.array,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
