import React, { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
import { SettingsContext } from "../../store/settings-context";

import WebViewChart from "../charts/WebViewChart";
import { ChartController, ExpenseData } from "../charts/controller";
import { createBarChartData } from "../charts/chartHelpers";

const ExpenseChart = ({
  inputData,
  xAxis,
  yAxis,
  budget,
  currency,
  onZoomIn,
  onZoomOut,
}) => {
  const { isLandscape } = useContext(OrientationContext);
  const { settings } = useContext(SettingsContext);

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
      console.log("📊 CHART DATA: No data available");
      return [];
    }

    const processedData = ChartController.processExpenseData(
      inputData as ExpenseData[],
      xAxis,
      yAxis,
      colors
    );

    console.log("📊 CHART DATA PROCESSED:", {
      inputDataLength: inputData.length,
      processedDataLength: processedData.length,
      xAxis,
      yAxis,
      timestamp: new Date().toISOString(),
    });

    return processedData;
  }, [inputData, xAxis, yAxis, colors]);

  const highchartsData = useMemo(() => {
    const effectiveBudget = settings?.showBarBudgetLine ? budget : 0;
    const result = createBarChartData(
      chartData,
      colors,
      effectiveBudget,
      width
    );

    console.log("📊 HIGHCHARTS DATA CREATED:", {
      chartDataLength: chartData.length,
      barWidth: result.barWidth,
      budgetValue: result.budgetValue,
      effectiveBudget,
      width,
      timestamp: new Date().toISOString(),
    });

    return {
      ...result,
      budgetColor: colors.budget,
    };
  }, [chartData, colors, budget, width, settings?.showBarBudgetLine]);

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
        labelsEnabled={!!settings?.showBarLabels}
        showSkeleton={true}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
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
  onZoomIn: PropTypes.func,
  onZoomOut: PropTypes.func,
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
