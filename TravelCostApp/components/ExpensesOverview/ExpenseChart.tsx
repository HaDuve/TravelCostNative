import React, { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";

import WebViewChart from "../charts/WebViewChart";
import { ChartController, ExpenseData } from "../charts/controller";
import { createBarChartData } from "../charts/chartHelpers";

const ExpenseChart = ({ inputData, xAxis, yAxis, budget, currency }) => {
  const { isLandscape } = useContext(OrientationContext);

  const colors = useMemo(
    () => ({
      primary: GlobalStyles.colors.primary500,
      error: GlobalStyles.colors.error300,
      gray: GlobalStyles.colors.gray300,
      budget: GlobalStyles.colors.gray700,
    }),
    []
  );

  const { width, height } = ChartController.getChartDimensions(isLandscape);

  const chartData = useMemo(() => {
    if (!inputData || inputData.length === 0) {
      return [];
    }

    return ChartController.processExpenseData(
      inputData as ExpenseData[],
      xAxis,
      yAxis,
      colors
    );
  }, [inputData, xAxis, yAxis, colors]);

  const highchartsData = useMemo(() => {
    const result = createBarChartData(chartData, colors, budget, width);
    return {
      ...result,
      budgetColor: colors.budget,
    };
  }, [chartData, colors, budget, width]);

  const chartOptions = useMemo(() => {
    return ChartController.createExpenseChartOptions(
      budget,
      colors,
      getCurrencySymbol(currency)
    );
  }, [budget, colors, currency]);

  return (
    <View style={styles.container}>
      <WebViewChart
        data={highchartsData}
        options={chartOptions}
        width={width}
        height={height}
        showSkeleton={true}
      />
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: dynamicScale(8),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
