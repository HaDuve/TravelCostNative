import React, { useMemo, useState, useCallback, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
import { GlobalStyles } from "../../constants/styles";
import { getCatLocalized } from "../../util/category";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";
import { SettingsContext } from "../../store/settings-context";
import { UserContext } from "../../store/user-context";

import WebViewChart from "../charts/WebViewChart";
import { ChartController, CategoryData } from "../charts/controller";
import { createPieChartData } from "../charts/chartHelpers";
import ExpenseSummaryModal from "../ExpensesOutput/ExpenseSummaryModal";
import { calculateBudgetOverview } from "../ExpensesOutput/budgetOverviewHelpers";
import { getRate } from "../../util/currencyExchange";
import { ExpenseData } from "../../util/expense";
import * as Haptics from "expo-haptics";
import { PieChartPointData, NavigationProp } from "../charts/chartTypes";
import { BudgetOverviewContentProps } from "../ExpensesOutput/BudgetOverviewContent";

interface CategoryChartProps {
  inputData: CategoryData[];
  tripCurrency: string;
  expenses?: ExpenseData[];
  periodName?: string;
  navigation?: NavigationProp;
}

interface ExpenseSummaryModalProps extends BudgetOverviewContentProps {
  onDetailsPress: () => void;
}

const CategoryChart = React.memo(
  ({
    inputData,
    tripCurrency,
    expenses,
    periodName,
    navigation,
  }: CategoryChartProps) => {
    const { isPortrait } = useContext(OrientationContext);
    const tripCtx = useContext(TripContext);
    const expensesCtx = useContext(ExpensesContext);
    const { settings } = useContext(SettingsContext);
    const userCtx = useContext(UserContext);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalProps, setModalProps] =
      useState<ExpenseSummaryModalProps | null>(null);

    const { width, height } = ChartController.getChartDimensions(isPortrait);

    const chartData = useMemo(() => {
      if (!inputData || inputData.length === 0) {
        return [];
      }

      return inputData.map((item: CategoryData) => ({
        x: getCatLocalized(item.x),
        y: item.y,
        label: `${getCatLocalized(item.x)} ${Number(item.y).toFixed(
          2
        )} ${getCurrencySymbol(tripCurrency)}`,
        color: item?.color || GlobalStyles.colors.primary400,
        originalData: item,
      }));
    }, [inputData, tripCurrency]);

    const highchartsData = useMemo(() => {
      return createPieChartData(chartData);
    }, [chartData]);

    const chartOptions = useMemo(() => {
      return ChartController.createCategoryChartOptions();
    }, []);

    const handleChartReady = () => {
      // Chart is ready, no specific action needed
    };

    const handlePointClick = useCallback(
      async (pointData: PieChartPointData) => {
        if (!expenses || !navigation) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Get category name from point data
        // The name might be localized, so we need to find the original category
        let clickedName = pointData.name || pointData.x;

        // Strip HTML tags and extract just the category name
        // The name might be formatted as "Category<br/><span>...</span>" or contain HTML
        if (clickedName && typeof clickedName === "string") {
          // Remove HTML tags using regex, or split by <br/> and take first part
          clickedName = clickedName
            .split("<br/>")[0] // Get part before <br/>
            .split("<br>")[0] // Also handle <br> without slash
            .trim(); // Remove any trailing whitespace
        }

        if (!clickedName) return;

        // Find the original category from inputData
        const clickedCategory = inputData.find((item) => {
          const localizedName = getCatLocalized(item.x);
          return localizedName === clickedName || item.x === clickedName;
        });
        if (!clickedCategory) return;

        // Filter expenses by category
        const filteredExpenses = expenses.filter(
          (expense) =>
            expense.category === clickedCategory.x &&
            (!expense.isSpecialExpense ||
              (expense.isSpecialExpense && !settings.hideSpecialExpenses))
        );
        if (filteredExpenses.length === 0) return;

        // Get rate for currency conversion
        let rate = 1;
        if (userCtx.lastCurrency && tripCtx.tripCurrency) {
          rate = await getRate(tripCtx.tripCurrency, userCtx.lastCurrency);
        }

        // Create period name for calculation
        const categoryLabel = getCatLocalized(clickedCategory.x);
        const periodNameForCalc = `category-${clickedCategory.x}`;
        const periodLabel = `${categoryLabel}${periodName ? ` - ${periodName}` : ""}`;

        // Calculate budget overview props
        const calculation = calculateBudgetOverview({
          expenses: filteredExpenses,
          periodName: periodNameForCalc,
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
        expenses,
        navigation,
        inputData,
        settings,
        expensesCtx,
        tripCtx,
        userCtx.lastCurrency,
        periodName,
      ]
    );

    return (
      <View style={styles.container}>
        <WebViewChart
          data={highchartsData}
          options={chartOptions}
          width={width}
          height={height}
          onChartReady={handleChartReady}
          onPointClick={handlePointClick}
          style={styles.chart}
          showSkeleton={true}
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
  }
);

CategoryChart.displayName = "CategoryChart";

export default CategoryChart;

const styles = StyleSheet.create({
  container: {
    padding: dynamicScale(8),
    paddingTop: dynamicScale(40, true),
    justifyContent: "center",
    alignItems: "center",
    height: dynamicScale(320, true),
  },
  chart: {
    backgroundColor: "transparent",
  },
});
