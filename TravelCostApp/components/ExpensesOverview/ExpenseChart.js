import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
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
  const CAP = 10;
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
        height={200}
        animate={{ duration: 500 }}
        padding={{ top: 10, bottom: 10, left: 10, right: 10 }}
        domainPadding={{ x: [10, 10], y: 5 }}
      >
        <VictoryBar
          style={{
            data: {
              fill: ({ datum }) => datum.fill,
            },
          }}
          standalone={false}
          data={data}
          x={xAxisString}
          y={yAxisString}
        />
        <VictoryLine
          data={[
            {
              x: getDateMinusDays(new Date(), daysRange),
              y: Number(budget),
            },
            { x: new Date(), y: Number(budget) },
          ]}
          standalone={false}
          style={{
            data: { stroke: GlobalStyles.colors.gray700, strokeWidth: 2 },
          }}
        />
      </VictoryChart>
    </View>
  );
};

export default memo(ExpenseChart);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
