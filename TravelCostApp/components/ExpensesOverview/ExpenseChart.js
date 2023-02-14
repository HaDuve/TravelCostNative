import React, { memo } from "react";
import { StyleSheet, Vibration, View } from "react-native";
import * as Haptics from "expo-haptics";
import {
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import { GlobalStyles } from "../../constants/styles";
import { getDateMinusDays } from "../../util/date";

const ExpenseChart = ({
  inputData,
  xAxis,
  yAxis,
  budgetAxis,
  budget,
  daysRange,
  currency,
  navigation,
}) => {
  console.log("ExpenseChart rendered");

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
  const CAP = 2;
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
  return (
    <View style={styles.container}>
      <VictoryChart
        height={160}
        animate={{ duration: 500 }}
        padding={{ top: 10, bottom: 36, left: 30, right: 40 }}
        domainPadding={{ x: [0, 25] }}
        // domain={{ y: [0, 2 * budget] }}
        containerComponent={
          <VictoryVoronoiContainer mouseFollowTooltip voronoiDimension="x" />
        }
      >
        <VictoryLine
          labelComponent={
            <VictoryTooltip center={{ x: 80, y: 25 }} renderInPortal={false} />
          }
          data={[
            {
              x: getDateMinusDays(new Date(), Math.floor(daysRange / 1)),
              y: Number(budget),
              label: `Budget: ${budget} ${currency}`,
            },
            {
              x: new Date(),
              y: Number(budget),
              // label: `Budget: ${budget} ${currency}`,
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
              center={{ x: 178, y: 24 }}
              renderInPortal={false}
              constrainToVisibleArea
            />
          }
          style={{
            data: {
              fill: ({ datum }) => datum.fill,
              strokeWidth: ({ active }) => (active ? 4 : 0),
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

export default memo(ExpenseChart);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: "8%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
