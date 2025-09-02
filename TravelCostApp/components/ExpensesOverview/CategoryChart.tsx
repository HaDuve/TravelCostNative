import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { getCatString } from "../../util/category";
import PropTypes from "prop-types";
import { useContext } from "react";
import { TripContext } from "../../store/trip-context";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";

import WebViewChart from "../charts/WebViewChart";
import { ChartController, CategoryData } from "../charts/controller";
import { createPieChartData } from "../charts/chartHelpers";

const CategoryChart = ({ inputData }) => {
  const tripCtx = useContext(TripContext);
  const tripCurrency = tripCtx.tripCurrency;
  const { isPortrait } = useContext(OrientationContext);

  const { width, height } = ChartController.getCategoryDimensions(
    isPortrait,
    dynamicScale
  );

  const chartData = useMemo(() => {
    if (!inputData || inputData.length === 0) {
      return [];
    }

    return inputData.map((item: any) => ({
      x: getCatString(item.x),
      y: item.y,
      label: `${getCatString(item.x)} ${Number(item.y).toFixed(2)} ${getCurrencySymbol(tripCurrency)}`,
      color: item?.color || GlobalStyles.colors.primary400,
      originalData: item
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
    <Animated.View exiting={FadeOut} entering={ZoomIn} style={styles.container}>
      <WebViewChart
        data={highchartsData}
        options={chartOptions}
        width={width}
        height={height}
        onChartReady={handleChartReady}
        style={styles.chart}
      />
    </Animated.View>
  );
};

export default CategoryChart;

CategoryChart.propTypes = {
  inputData: PropTypes.array,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: dynamicScale(12),
    paddingTop: dynamicScale(60, true),
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: dynamicScale(100),
    borderRadius: 9999,
  },
  chart: {
    backgroundColor: 'transparent',
  },
});