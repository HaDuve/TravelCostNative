import React from "react";
import { StyleSheet, View } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
} from "victory-native";
import { GlobalStyles } from "../../constants/styles";

const ExpenseChart = ({ inputData, xAxis, yAxis, budgetAxis }) => {
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

  inputData.forEach((obj) => {
    if (obj.expensesSum > 0) {
      obj.fill = "green";
    }
    if (
      obj.expensesSum > obj.dailyBudget ||
      obj.expensesSum > obj.weeklyBudget ||
      obj.expensesSum > obj.montylyBudget ||
      obj.expensesSum > obj.yearlyBudget
    ) {
      obj.fill = "red";
    }
  });
  return (
    <View style={styles.container}>
      <VictoryChart height={200} animate={{ duration: 2000 }}>
        <VictoryBar
          style={{
            data: {
              fill: ({ datum }) => datum.fill,
            },
          }}
          data={data}
          x={xAxisString}
          y={yAxisString}
        />
      </VictoryChart>
    </View>
  );
};

export default ExpenseChart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
