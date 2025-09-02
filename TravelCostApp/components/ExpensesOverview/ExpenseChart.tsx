import React, { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = ((Localization.getLocales()[0]&&Localization.getLocales()[0].languageCode)?Localization.getLocales()[0].languageCode.slice(0,2):'en');
i18n.enableFallback = true;

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import { formatExpenseWithCurrency } from "../../util/string";
import { isSameDay } from "../../util/dateTime";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
import WIPChart from "../WIPChart";

import WebViewChart from "../charts/WebViewChart";
import { ChartController, ExpenseData } from "../charts/controller";
import { createBarChartData } from "../charts/chartHelpers";

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

  const colors = {
    primary: GlobalStyles.colors.primary500,
    error: GlobalStyles.colors.error300,
    gray: GlobalStyles.colors.gray400,
    budget: GlobalStyles.colors.gray700
  };

  const { width, height } = ChartController.getChartDimensions(
    isLandscape,
    isTablet,
    dynamicScale
  );

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
    return createBarChartData(chartData, budget, colors);
  }, [chartData, budget, colors]);

  const chartOptions = useMemo(() => {
    return ChartController.createExpenseChartOptions(budget, colors);
  }, [budget, colors]);

  const handlePointClick = (data: any) => {
    if (!data.originalData) return;

    const datum = data.originalData;
    const budgetAmount = 
      datum.dailyBudget ||
      datum.weeklyBudget ||
      datum.monthlyBudget ||
      datum.yearlyBudget;

    const budgetStatus = ChartController.calculateBudgetStatus(
      datum.expensesSum,
      budgetAmount,
      currency
    );

    const overUnderString = budgetStatus.isOverBudget
      ? `${i18n.t("overBudget")} ${formatExpenseWithCurrency(
          Math.abs(budgetStatus.difference),
          currency
        )}`
      : `${i18n.t("underBudget")} ${formatExpenseWithCurrency(
          budgetStatus.difference,
          currency
        )}`;

    Toast.show({
      type: budgetStatus.isOverBudget ? "error" : "success",
      text1: `${datum.label}`,
      text2: overUnderString,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePointLongPress = (data: any) => {
    if (!data.originalData) return;

    const datum = data.originalData;
    const filteredExpenses = ChartController.filterExpensesByDate(expenses, datum);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    navigation.navigate("FilteredPieCharts", {
      expenses: filteredExpenses,
      dayString: `${datum.label}`,
    });
  };

  return (
    <View style={styles.container}>
      <WebViewChart
        data={highchartsData}
        options={chartOptions}
        width={width}
        height={height}
        onPointClick={handlePointClick}
        onPointLongPress={handlePointLongPress}
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