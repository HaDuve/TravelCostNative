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

import WebViewChart from "../charts/WebViewChart";
import { WebView } from "react-native-webview";
import { ChartController, ExpenseData } from "../charts/controller";
import {
  createBarChartData,
  getInitialZoomRange,
} from "../charts/chartHelpers";
import IconButton from "../UI/IconButton";

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
}) => {
  const { isLandscape } = useContext(OrientationContext);
  const [showResetButton, setShowResetButton] = useState(false);
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
    console.log("🔄 Reset button pressed");
    if (!webViewRef.current) return;

    console.log("🔄 WebView ref:", webViewRef.current);

    // Use centralized zoom configuration
    const zoomRange = getInitialZoomRange(periodType);

    webViewRef.current.injectJavaScript(`
        window.setExtremes(${zoomRange.min}, ${zoomRange.max});
        true;
      `);

    setShowResetButton(false);
  }, [periodType]);

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
        onWebViewRef={(ref) => {
          webViewRef.current = ref;
          onWebViewRef?.(ref);
        }}
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
