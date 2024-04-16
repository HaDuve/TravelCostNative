import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryVoronoiContainer,
  VictoryTooltip,
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
import { getDateMinusDays } from "../../util/date";
import PropTypes from "prop-types";
import { formatExpenseWithCurrency } from "../../util/string";
import { isSameDay } from "../../util/dateTime";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { dynamicScale, scale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";

const ExpenseChart = ({
  inputData,
  xAxis,
  yAxis,
  budget,
  currency,
  navigation,
  expenses,
}) => {
  const { isLandscape, isTablet } = useContext(OrientationContext);
  const data = inputData;
  const firstItem = inputData[0];
  const [lastItem] = inputData.slice(-1);
  const lastItemDate = new Date(firstItem.day ?? firstItem.firstDay);

  const firstItemDate = getDateMinusDays(
    new Date(lastItem.day ?? lastItem.lastDay),
    1
  );

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
  const hTabletScaling = isLandscape ? 1.7 : 1.9;
  const hPhoneScaling = isLandscape ? 16 : 1.9;
  const wTabletScaling = isLandscape ? 0.8 : 1;
  const wPhoneScaling = isLandscape ? 10 : 0.1;
  const hScaling = isTablet ? hTabletScaling : hPhoneScaling;
  const wScaling = isTablet ? wTabletScaling : wPhoneScaling;
  const height = dynamicScale(240, false, hScaling);
  const width = dynamicScale(460, false, wScaling);

  return (
    <View style={styles.container}>
      <VictoryChart
        domain={{ x: [firstItemDate, lastItemDate] }}
        height={height}
        width={width}
        animate={{
          duration: 1000,
          onLoad: { duration: 1000 },
        }}
        padding={{
          top: dynamicScale(20, true),
          bottom: dynamicScale(30, true),
          left: dynamicScale(60),
          right: dynamicScale(30),
        }}
        domainPadding={{ x: [scale(0), dynamicScale(20)] }}
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
              center={{ x: dynamicScale(210), y: dynamicScale(26, true, true) }}
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
              center={{ x: dynamicScale(212), y: dynamicScale(28, true) }}
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
                        // console.log(datum);
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
                        // console.log(datum);
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
