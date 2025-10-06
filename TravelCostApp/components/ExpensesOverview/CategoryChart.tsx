import React, { useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { OrientationContext } from "../../store/orientation-context";
import { getCatString } from "../../util/category";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { dynamicScale } from "../../util/scalingUtil";
import { createPieChartData } from "../charts/chartHelpers";
import { CategoryData, ChartController } from "../charts/controller";
import WebViewChart from "../charts/WebViewChart";

const CategoryChart = React.memo(
  ({
    inputData,
    tripCurrency,
  }: {
    inputData: CategoryData[];
    tripCurrency: string;
  }) => {
    const { isPortrait } = useContext(OrientationContext);

    const { width, height } = ChartController.getChartDimensions(isPortrait);

    const chartData = useMemo(() => {
      if (!inputData || inputData.length === 0) {
        return [];
      }

      return inputData.map((item: any) => ({
        x: getCatString(item.x),
        y: item.y,
        label: `${getCatString(item.x)} ${Number(item.y).toFixed(
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
      <View style={styles.container}>
        {inputData && inputData.length > 0 && (
          <WebViewChart
            data={highchartsData}
            options={chartOptions}
            width={width}
            height={height}
            onChartReady={handleChartReady}
            style={styles.chart}
          />
        )}
      </View>
    );
  }
);

CategoryChart.displayName = "CategoryChart";

export default CategoryChart;

const styles = StyleSheet.create({
  chart: {
    backgroundColor: "transparent",
  },
  container: {
    alignItems: "center",
    height: dynamicScale(320, true),
    justifyContent: "center",
    padding: dynamicScale(8),
    paddingTop: dynamicScale(40, true),
  },
});
