import React, {
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from "react";
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
import { ChartController } from "../charts/controller";
import { ExpenseData } from "../../util/expense";
import {
  createBarChartData,
  getInitialZoomRange,
} from "../charts/chartHelpers";
import IconButton from "../UI/IconButton";
import { calculateDailyAverage } from "../../util/budgetColorHelper";
import ExpenseSummaryModal from "../ExpensesOutput/ExpenseSummaryModal";
import { calculateBudgetOverview } from "../ExpensesOutput/budgetOverviewHelpers";
import { getRate } from "../../util/currencyExchange";
import { UserContext } from "../../store/user-context";
import * as Haptics from "expo-haptics";
import { BarChartPointData, NavigationProp } from "../charts/chartTypes";
import { BudgetOverviewContentProps } from "../ExpensesOutput/BudgetOverviewContent";

interface ExpenseChartProps {
  inputData: unknown[];
  xAxis: string;
  yAxis: string;
  budget: number;
  currency: string;
  periodType?: "day" | "week" | "month" | "year";
  onWebViewRef?: (ref: WebView | null) => void;
  onZoomStateChange?: (zoomState: {
    isLatestVisible: boolean;
    visiblePeriods: number;
    minDate: Date | null;
    maxDate: Date | null;
  }) => void;
  navigation?: NavigationProp;
}

interface ExpenseSummaryModalProps extends BudgetOverviewContentProps {
  onDetailsPress: () => void;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({
  inputData,
  xAxis,
  yAxis,
  budget,
  currency,
  periodType,
  onWebViewRef,
  onZoomStateChange,
  navigation,
}) => {
  const { isLandscape } = useContext(OrientationContext);
  const tripCtx = useContext(TripContext);
  const expensesCtx = useContext(ExpensesContext);
  const { settings } = useContext(SettingsContext);
  const userCtx = useContext(UserContext);
  const [showResetButton, setShowResetButton] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState<any>(null);
  const webViewRef = useRef<WebView>(null);

  const colors = useMemo(
    () => ({
      primary: GlobalStyles.colors.primary500,
      error: GlobalStyles.colors.error300,
      gray: GlobalStyles.colors.gray300,
      budget: GlobalStyles.colors.gray700,
    }),
    []
  );

  // Calculate current period average and determine overBudgetColor
  const overBudgetColor = useMemo(() => {
    if (!periodType || !settings.trafficLightBudgetColors) {
      return GlobalStyles.colors.error300;
    }

    const today = new Date();
    const averageDailySpending = calculateDailyAverage(
      periodType as "day" | "week" | "month" | "year" | "total",
      today,
      expensesCtx,
      tripCtx,
      settings.hideSpecialExpenses
    );

    const dailyBudget = Number(tripCtx.dailyBudget) || 0;

    // If average is below daily budget, use orange; otherwise use red
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
      inputData as any,
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
      getCurrencySymbol(currency),
      periodType
    );
  }, [budget, colors, currency, periodType]);

  const handleZoomLevelChange = useCallback(
    (_zoomType: string, _min: number, _max: number) => {
      setShowResetButton(true);
    },
    []
  );

  const handleZoomStateChange = useCallback(
    (zoomState: {
      isLatestVisible: boolean;
      visiblePeriods: number;
      minDate: Date | null;
      maxDate: Date | null;
    }) => {
      onZoomStateChange?.(zoomState);
    },
    [onZoomStateChange]
  );

  const handleReset = useCallback(() => {
    if (!webViewRef.current) return;

    // Use centralized zoom configuration
    const zoomRange = getInitialZoomRange(periodType);

    webViewRef.current.injectJavaScript(`
        window.setExtremes(${zoomRange.min}, ${zoomRange.max});
        true;
      `);

    setShowResetButton(false);
  }, [periodType]);

  const handlePointClick = useCallback(
    async (pointData: BarChartPointData) => {
      if (!periodType || !navigation) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Get the original data from the point
      // The originalData is from the chart which has day/firstDay properties
      const originalData = pointData.originalData;
      if (!originalData) return;

      // Filter expenses based on periodType and clicked point
      let filteredExpenses: ExpenseData[] = [];
      let periodLabel = "";
      let periodNameForCalc = periodType;

      // Get rate for currency conversion
      let rate = 1;
      if (userCtx.lastCurrency && tripCtx.tripCurrency) {
        rate = await getRate(tripCtx.tripCurrency, userCtx.lastCurrency);
      }

      switch (periodType) {
        case "day":
          if (originalData.day) {
            filteredExpenses = expensesCtx
              .getSpecificDayExpenses(new Date(originalData.day))
              .filter(
                (exp) =>
                  !exp.isSpecialExpense ||
                  (exp.isSpecialExpense && !settings.hideSpecialExpenses)
              );
            periodLabel = new Date(originalData.day).toLocaleDateString();
            periodNameForCalc = "day";
          }
          break;
        case "week":
          if (originalData.firstDay) {
            filteredExpenses = expensesCtx
              .getSpecificWeekExpenses(new Date(originalData.firstDay))
              .filter(
                (exp) =>
                  !exp.isSpecialExpense ||
                  (exp.isSpecialExpense && !settings.hideSpecialExpenses)
              );
            periodLabel = new Date(originalData.firstDay).toLocaleDateString();
            periodNameForCalc = "week";
          }
          break;
        case "month":
          if (originalData.firstDay) {
            filteredExpenses = expensesCtx
              .getSpecificMonthExpenses(new Date(originalData.firstDay))
              .filter(
                (exp) =>
                  !exp.isSpecialExpense ||
                  (exp.isSpecialExpense && !settings.hideSpecialExpenses)
              );
            const monthDate = new Date(originalData.firstDay);
            periodLabel = monthDate.toLocaleDateString("default", {
              month: "long",
              year: "numeric",
            });
            periodNameForCalc = "month";
          }
          break;
        case "year":
          if (originalData.firstDay) {
            filteredExpenses = expensesCtx
              .getSpecificYearExpenses(new Date(originalData.firstDay))
              .filter(
                (exp) =>
                  !exp.isSpecialExpense ||
                  (exp.isSpecialExpense && !settings.hideSpecialExpenses)
              );
            const yearDate = new Date(originalData.firstDay);
            periodLabel = yearDate.getFullYear().toString();
            periodNameForCalc = "year";
          }
          break;
      }

      if (filteredExpenses.length === 0) return;

      // Calculate budget overview props
      const calculation = calculateBudgetOverview({
        expenses: filteredExpenses as ExpenseData[],
        periodName: periodNameForCalc as "day" | "week" | "month" | "year",
        expCtx: expensesCtx,
        tripCtx,
        settings,
        hideSpecial: settings.hideSpecialExpenses,
      });

      // Prepare modal props
      const travellers = Array.isArray(tripCtx.travellers)
        ? tripCtx.travellers
        : [];
      const travellerNames = travellers.map((traveller) =>
        typeof traveller === "string" ? traveller : traveller?.userName
      );

      const props: ExpenseSummaryModalProps = {
        travellerList: travellerNames,
        travellerBudgets:
          travellerNames.length > 0
            ? calculation.budgetNumber / travellerNames.length
            : 0,
        travellerSplitExpenseSums: calculation.travellerSplitExpenseSums,
        currency: calculation.tripCurrency,
        noTotalBudget: calculation.noTotalBudget,
        periodName: periodNameForCalc,
        periodLabel: periodLabel,
        lastRateUnequal1: rate !== 1,
        trafficLightActive: settings.trafficLightBudgetColors,
        currentBudgetColor: calculation.budgetColor,
        averageDailySpending: calculation.averageDailySpending,
        dailyBudget: Number(tripCtx.dailyBudget) || 0,
        expenseSumNum: calculation.expenseSumNum,
        budgetNumber: calculation.budgetNumber,
        onDetailsPress: () => {
          navigation.navigate("FilteredPieCharts", {
            expenses: filteredExpenses,
            dayString: periodLabel,
          });
        },
      };

      setModalProps(props);
      setIsModalVisible(true);
    },
    [
      periodType,
      navigation,
      expensesCtx,
      tripCtx,
      settings,
      userCtx.lastCurrency,
      tripCtx.tripCurrency,
    ]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {showResetButton && (
          <IconButton
            icon="refresh"
            size={dynamicScale(20)}
            color={GlobalStyles.colors.primary500}
            onPress={handleReset}
            buttonStyle={styles.resetButton}
          />
        )}
      </View>
      <WebViewChart
        data={highchartsData}
        options={chartOptions}
        width={width}
        height={height}
        showSkeleton={true}
        onZoomLevelChange={handleZoomLevelChange}
        onZoomStateChange={handleZoomStateChange}
        onPointClick={handlePointClick}
        onWebViewRef={(ref) => {
          webViewRef.current = ref;
          onWebViewRef?.(ref);
        }}
      />
      {modalProps && (
        <ExpenseSummaryModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          {...modalProps}
        />
      )}
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
  onZoomStateChange: PropTypes.func,
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
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: dynamicScale(16),
    paddingVertical: dynamicScale(8),
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 10,
  },
  resetButton: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primary500,
  },
});
