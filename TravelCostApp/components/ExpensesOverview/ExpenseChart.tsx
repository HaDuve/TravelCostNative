import React, { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
import { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";
import { SettingsContext } from "../../store/settings-context";

import WebViewChart from "../charts/WebViewChart";
import { WebView } from "react-native-webview";
import { ChartController, ExpenseData } from "../charts/controller";
import { createBarChartData } from "../charts/chartHelpers";
import { calculateDailyAverage } from "../../util/budget";

interface ExpenseChartProps {
  inputData: unknown[];
  xAxis: string;
  yAxis: string;
  budget: number;
  currency: string;
  periodType?: "day" | "week" | "month" | "year";
  onWebViewRef?: (ref: WebView | null) => void;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({
  inputData,
  xAxis,
  yAxis,
  budget,
  currency,
  periodType,
  onWebViewRef,
}) => {
  const { isLandscape } = useContext(OrientationContext);
  const tripCtx = useContext(TripContext);
  const expensesCtx = useContext(ExpensesContext);
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

  const overBudgetColor = useMemo(() => {
    if (!periodType || !settings.trafficLightBudgetColors) {
      return GlobalStyles.colors.error300;
    }

    const today = new Date();
    const averageDailySpending = calculateDailyAverage(
      periodType as "day" | "week" | "month" | "year" | "total",
      today,
      expensesCtx.expenses || [],
      { startDate: tripCtx.startDate },
      settings.hideSpecialExpenses
    );

    const dailyBudget = Number(tripCtx.dailyBudget) || 0;

    return averageDailySpending <= dailyBudget
      ? GlobalStyles.colors.accent500
      : GlobalStyles.colors.error300;
  }, [
    periodType,
    settings.trafficLightBudgetColors,
    settings.hideSpecialExpenses,
    expensesCtx,
    tripCtx,
  ]);

  const { width, height } = ChartController.getChartDimensions(isLandscape);

  const chartData = useMemo(() => {
    if (!inputData || inputData.length === 0) {
      return [];
    }

    return ChartController.processExpenseData(
      inputData as ExpenseData[],
      xAxis,
      yAxis,
      colors,
      overBudgetColor
    );
  }, [inputData, xAxis, yAxis, colors, overBudgetColor]);

  const highchartsData = useMemo(() => {
    return createBarChartData(chartData, colors);
  }, [chartData, colors]);

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
        onWebViewRef={onWebViewRef}
      />
    </View>
  );
};

export default ExpenseChart;

ExpenseChart.propTypes = {
  inputData: PropTypes.array.isRequired,
  xAxis: PropTypes.string.isRequired,
  yAxis: PropTypes.string.isRequired,
  budget: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  periodType: PropTypes.oneOf(["day", "week", "month", "year"]),
  onWebViewRef: PropTypes.func,
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
