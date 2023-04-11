import React, { memo } from "react";
import { StyleSheet, Vibration, View } from "react-native";
import * as Haptics from "expo-haptics";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import { GlobalStyles } from "../../constants/styles";
import { getDateMinusDays, getDatePlusDays } from "../../util/date";
import PropTypes from "prop-types";
import { DateTime } from "luxon";
import getSymbolFromCurrency from "currency-symbol-map";

const ExpenseChart = ({
  inputData,
  xAxis,
  yAxis,
  budget,
  daysRange,
  currency,
}) => {
  const data = inputData
    ? inputData
    : // DUMMYDATA BEGIN
      [
        { quarter: 1, earnings: 13000 },
        { quarter: 2, earnings: 16500 },
        { quarter: 3, earnings: 14250 },
        { quarter: 4, earnings: 19000 },
      ];
  const xAxisString = xAxis ? xAxis : "quarter";
  const yAxisString = yAxis ? yAxis : "earnings";
  // DUMMYDATA END

  inputData?.forEach((obj) => {
    if (
      obj.expensesSum > obj.dailyBudget ||
      obj.expensesSum > obj.weeklyBudget ||
      obj.expensesSum > obj.monthlyBudget ||
      obj.expensesSum > obj.yearlyBudget
    ) {
      obj.fill = GlobalStyles.colors.error300;
    } else {
      if (obj.expensesSum > 0) {
        obj.fill = GlobalStyles.colors.primary500;
      }
    }
  });
  // cap expensesSum at 5*dailyBudget 5*weeklyBudget 5*monthlyBudget 5*yearlyBudget respectively
  const CAP = 3;
  inputData?.forEach((obj) => {
    if (obj.expensesSum > CAP * obj.yearlyBudget) {
      obj.expensesSum = CAP * obj.yearlyBudget;
    }
    if (obj.expensesSum > CAP * obj.monthlyBudget) {
      obj.expensesSum = CAP * obj.monthlyBudget;
    }
    if (obj.expensesSum > CAP * obj.weeklyBudget) {
      obj.expensesSum = CAP * obj.weeklyBudget;
    }
    if (obj.expensesSum > CAP * obj.dailyBudget) {
      obj.expensesSum = CAP * obj.dailyBudget;
    }
  });
  console.log("expenseChart");
  return (
    <View style={styles.container}>
      <VictoryChart
        height={160}
        animate={{
          duration: 1000,
          onLoad: { duration: 1000 },
        }}
        padding={{ top: 10, bottom: 30, left: 60, right: 30 }}
        domainPadding={{ x: [0, 20] }}
        containerComponent={<VictoryVoronoiContainer voronoiDimension="x" />}
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
          labelComponent={
            <VictoryTooltip
              center={{ x: 210, y: 26 }}
              constrainToVisibleArea
              renderInPortal={false}
            />
          }
          data={[
            {
              x: getDateMinusDays(new Date(), Math.floor(daysRange / 1)),
              y: Number(budget),
              label: `Budget: ${budget} ${getSymbolFromCurrency(currency)}`,
            },
            {
              x: DateTime.now().toJSDate(),
              y: Number(budget),
              // label: `Budget: ${budget} ${getSymbolFromCurrency(currency)}`,
            },
          ]}
          standalone={false}
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
                onPressIn: () => {
                  console.log("press");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
