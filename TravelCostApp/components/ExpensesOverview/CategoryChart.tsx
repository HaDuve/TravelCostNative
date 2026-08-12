import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { getCatLocalized } from "../../util/category";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { useLayoutProfile } from "../../store/layout-context";
import { useChartContainerWidth } from "../charts/useChartContainerWidth";

import WebViewChart from "../charts/WebViewChart";
import { ChartController, CategoryData } from "../charts/controller";
import { createPieChartData } from "../charts/chartHelpers";

const CategoryChart = React.memo(
  ({
    inputData,
    tripCurrency,
  }: {
    inputData: CategoryData[];
    tripCurrency: string;
  }) => {
    const layout = useLayoutProfile();
    const containerWidth = useChartContainerWidth();
    const { width, height, paddingHorizontal } =
      ChartController.getChartDimensions({
        kind: "pie",
        containerWidth,
        breakpoint: layout.breakpoint,
        orientation: layout.orientation,
      });

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

    return (
      <View style={[styles.container, { paddingHorizontal, height }]}>
        <WebViewChart
          data={highchartsData}
          options={chartOptions}
          width={width}
          height={height}
          onChartReady={handleChartReady}
          style={styles.chart}
          showSkeleton={true}
        />
      </View>
    );
  }
);

CategoryChart.displayName = "CategoryChart";

export default CategoryChart;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  chart: {
    backgroundColor: "transparent",
  },
});
