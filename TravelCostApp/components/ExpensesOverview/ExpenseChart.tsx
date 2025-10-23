import React, { useCallback, useContext, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";

import WebViewChart from "../charts/WebViewChart";
import { WebView } from "react-native-webview";
import { ChartController, ExpenseData } from "../charts/controller";
import { createBarChartData } from "../charts/chartHelpers";

interface ExpenseChartProps {
  inputData: unknown[];
  xAxis: string;
  yAxis: string;
  budget: number;
  currency: string;
}

const ExpenseChart = React.forwardRef<WebView, ExpenseChartProps>(function ExpenseChart({ inputData, xAxis, yAxis, budget, currency }, ref) {
  const { isLandscape } = useContext(OrientationContext);
  const [showResetButton, setShowResetButton] = useState(false);
  const defaultViewRange = 7; // 7 days default view

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
    return createBarChartData(chartData, colors);
  }, [chartData, colors]);

  const chartOptions = useMemo(() => {
    return ChartController.createExpenseChartOptions(
      budget,
      colors,
      getCurrencySymbol(currency)
    );
  }, [budget, colors, currency]);

  const handleZoomLevelChange = useCallback(() => {
    setShowResetButton(true);
  }, []);

  const handleReset = useCallback(() => {
    if (!ref) return;

    const now = new Date().getTime();
    const sevenDaysAgo = now - (defaultViewRange * 24 * 3600 * 1000);
    
    (ref as React.RefObject<WebView>).current?.injectJavaScript(`
      window.setExtremes(${sevenDaysAgo}, ${now});
      true;
    `);

    setShowResetButton(false);
  }, [defaultViewRange, ref]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {showResetButton && (
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset View</Text>
          </TouchableOpacity>
        )}
      </View>
      <WebViewChart
        ref={ref}
        data={highchartsData}
        options={chartOptions}
        width={width}
        height={height}
        showSkeleton={true}
        onZoomLevelChange={handleZoomLevelChange}
      />
    </View>
  );
});

export default ExpenseChart;

ExpenseChart.propTypes = {
  inputData: PropTypes.array.isRequired,
  xAxis: PropTypes.string.isRequired,
  yAxis: PropTypes.string.isRequired,
  budget: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: dynamicScale(8),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: dynamicScale(16),
    paddingVertical: dynamicScale(8),
  },
  resetButton: {
    backgroundColor: GlobalStyles.colors.primary500,
    paddingHorizontal: dynamicScale(12),
    paddingVertical: dynamicScale(6),
    borderRadius: dynamicScale(4),
  },
  resetButtonText: {
    color: GlobalStyles.colors.backgroundColor,
    fontSize: dynamicScale(14),
    fontWeight: '500',
  },
});
