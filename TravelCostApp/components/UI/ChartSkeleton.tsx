import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated as RNAnimated,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useGlobalStyles } from "../../store/theme-context";
import { dynamicScale } from "../../util/scalingUtil";
import {
  CHART_SPACING,
  CHART_DIMENSIONS,
  CHART_STYLING,
  BAR_CHART_CONSTANTS,
  ChartCalculations,
  ChartType,
} from "../charts/chartConstants";

interface ChartSkeletonProps {
  type: ChartType;
  width?: number;
  height?: number;
  style?: object;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  type,
  width,
  height,
  style,
}) => {
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
  const shimmerAnimation = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const shimmer = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(shimmerAnimation, {
          toValue: 1,
          duration: CHART_STYLING.ANIMATION.SHIMMER_DURATION,
          useNativeDriver: true,
        }),
        RNAnimated.timing(shimmerAnimation, {
          toValue: 0,
          duration: CHART_STYLING.ANIMATION.SHIMMER_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Handle container margins like WebViewChart does
  const containerStyle = {
    marginHorizontal: width ? 0 : CHART_DIMENSIONS.CONTAINER_MARGIN,
    marginTop: dynamicScale(CHART_DIMENSIONS.CONTAINER_MARGIN_TOP), // Match WebViewChart marginTop
  };

  if (type === "pie") {
    // Calculate the actual pie chart size using the helper function
    const actualPieSize = ChartCalculations.getPieSize(
      width || CHART_DIMENSIONS.DEFAULT_HEIGHT.PIE,
      height || CHART_DIMENSIONS.DEFAULT_HEIGHT.PIE
    );

    return (
      <View
        style={[styles.container, { width, height }, containerStyle, style]}
      >
        <View style={styles.pieContainer}>
          {/* Pie chart skeleton - single solid circle */}
          <Animated.View
            entering={FadeIn.duration(600)}
            style={[
              styles.pieChart,
              {
                width: actualPieSize,
                height: actualPieSize,
                borderRadius: actualPieSize / 2,
              },
            ]}
          />
        </View>
        <RNAnimated.View
          style={[styles.shimmerOverlay, { opacity: shimmerOpacity }]}
        />
      </View>
    );
  }

  // Bar chart skeleton
  const barHeights = BAR_CHART_CONSTANTS.BAR_HEIGHTS;
  const chartHeight = height || CHART_DIMENSIONS.DEFAULT_HEIGHT.BAR;
  // Use full container width when no width specified (matches WebViewChart behavior)
  const chartWidth = width || "100%";

  // For calculations, we need a numeric width - use screen width as default
  // When using "100%", account for container margins like WebViewChart does
  const screenWidth = Dimensions.get("window").width;
  const numericWidth =
    typeof chartWidth === "string"
      ? screenWidth - CHART_DIMENSIONS.CONTAINER_MARGIN * 2 // Account for horizontal margins
      : chartWidth;

  // Match HighCharts spacing exactly
  const spacing = CHART_SPACING.BAR;

  // Calculate available chart area
  const chartAreaDimensions = ChartCalculations.getChartAreaDimensions(
    numericWidth,
    chartHeight,
    "bar"
  );

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[
        styles.container,
        { width: chartWidth, height: chartHeight },
        containerStyle,
        style,
      ]}
    >
      {/* Y-axis */}
      <View
        style={[styles.yAxis, { bottom: spacing.BOTTOM, width: spacing.LEFT }]}
      >
        {BAR_CHART_CONSTANTS.Y_AXIS_VALUES.map((value) => (
          <View key={value} style={styles.yAxisTick}>
            <View style={styles.yAxisLabel} />
            <View style={styles.yAxisLine} />
          </View>
        ))}
      </View>

      {/* X-axis */}
      <View
        style={[
          styles.xAxis,
          { left: spacing.LEFT, right: spacing.RIGHT, height: spacing.BOTTOM },
        ]}
      >
        {BAR_CHART_CONSTANTS.X_AXIS_LABELS.map((label) => (
          <View key={label} style={styles.xAxisTick}>
            <View style={styles.xAxisLabel} />
          </View>
        ))}
      </View>

      {/* Chart area */}
      <View
        style={[
          styles.chartArea,
          {
            top: spacing.TOP,
            left: spacing.LEFT,
            right: spacing.RIGHT,
            bottom: spacing.BOTTOM,
          },
        ]}
      >
        {/* Grid lines */}
        {ChartCalculations.getGridLinePositions(
          chartAreaDimensions.height,
          BAR_CHART_CONSTANTS.GRID_LINES_COUNT
        ).map((position, gridIndex) => (
          <View
            key={gridIndex}
            style={[styles.gridLine, { top: position.top }]}
          />
        ))}

        {/* Bars */}
        {ChartCalculations.getBarPositions(
          chartAreaDimensions.width,
          barHeights.length
        ).map((position, barIndex) => (
          <View
            key={barIndex}
            style={[
              styles.bar,
              {
                left: position.left,
                width: position.width,
                height: chartAreaDimensions.height * barHeights[barIndex],
                bottom: 0, // Align to bottom of chart area
              },
            ]}
          />
        ))}
      </View>

      {/* Shimmer overlay */}
      <RNAnimated.View
        style={[styles.shimmerOverlay, { opacity: shimmerOpacity }]}
      />
    </Animated.View>
  );
};

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
    container: {
      backgroundColor: GlobalStyles.colors.backgroundColor,
      position: "relative",
      overflow: "hidden",
    },
    shimmerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: GlobalStyles.colors.gray300,
      opacity: 0.3,
    },

    // Bar chart styles
    yAxis: {
      position: "absolute",
      left: 0,
      top: 0,
      justifyContent: "space-between",
    },
    yAxisTick: {
      flexDirection: "row",
      alignItems: "center",
      height: 1,
    },
    yAxisLabel: {
      width: dynamicScale(15),
      height: dynamicScale(8),
      backgroundColor: CHART_STYLING.SKELETON_COLORS.TEXT,
      borderRadius: CHART_STYLING.BORDER_RADIUS.SMALL,
    },
    yAxisLine: {
      flex: 1,
      height: 1,
      backgroundColor: CHART_STYLING.SKELETON_COLORS.BACKGROUND,
      marginLeft: 2,
    },
    xAxis: {
      position: "absolute",
      bottom: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingHorizontal: 10,
    },
    xAxisTick: {
      alignItems: "center",
    },
    xAxisLabel: {
      width: dynamicScale(25),
      height: dynamicScale(8),
      backgroundColor: CHART_STYLING.SKELETON_COLORS.TEXT,
      borderRadius: CHART_STYLING.BORDER_RADIUS.SMALL,
      marginBottom: 4,
    },
    chartArea: {
      position: "absolute",
    },
    gridLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: CHART_STYLING.SKELETON_COLORS.BACKGROUND,
    },
    bar: {
      position: "absolute",
      backgroundColor: CHART_STYLING.SKELETON_COLORS.ELEMENT,
      borderRadius: CHART_STYLING.BORDER_RADIUS.SMALL,
    },

    // Pie chart styles
    pieContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    pieChart: {
      backgroundColor: CHART_STYLING.SKELETON_COLORS.ELEMENT,
    },
  });

export default ChartSkeleton;
