import { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { OrientationContext } from "../../store/orientation-context";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { dynamicScale } from "../../util/scalingUtil";
import { createBarChartData } from "../charts/chartHelpers";
import { ChartController, ExpenseData } from "../charts/controller";
import WebViewChart from "../charts/WebViewChart";

const ExpenseChart = ({ inputData, xAxis, yAxis, budget, currency }) => {
  const { isLandscape } = useContext(OrientationContext);

  const colors = {
    primary: GlobalStyles.colors.primary500,
    error: GlobalStyles.colors.error300,
    gray: GlobalStyles.colors.gray300,
    budget: GlobalStyles.colors.gray700,
  };

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
    return createBarChartData(chartData, colors);
  }, [chartData, budget, colors]);

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
      />
    </View>
  );
};

export default ExpenseChart;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: dynamicScale(8),
  },
});
