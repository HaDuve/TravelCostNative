import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { StyleSheet, Platform, View, Animated } from "react-native";
import { WebView } from "react-native-webview";
import {
  generateHTMLTemplate,
  ChartData,
  ChartOptions,
  calculateVisiblePeriods,
} from "./chartHelpers";
import ChartSkeleton from "../UI/ChartSkeleton";
import { CHART_DIMENSIONS, CHART_STYLING, ChartType } from "./chartConstants";
import { dynamicScale } from "../../util/scalingUtil";

interface WebViewChartProps {
  data: unknown[]; // Highcharts series data format
  options?: ChartOptions;
  width?: number;
  height?: number;
  onChartReady?: () => void;
  onPointClick?: (data: unknown) => void;
  onPointLongPress?: (data: unknown) => void;
  onZoomLevelChange?: (zoomLevel: string, min: number, max: number) => void;
  onZoomStateChange?: (zoomState: {
    isLatestVisible: boolean;
    visiblePeriods: number;
    minDate: Date | null;
    maxDate: Date | null;
  }) => void;
  onWebViewRef?: (ref: WebView | null) => void;
  style?: object;
  showSkeleton?: boolean;
}

interface ChartMessage {
  type: string;
  data?: {
    message?: string;
    zoomRatio?: number;
    min?: number;
    max?: number;
    daysInRange?: number;
    timestamp?: string;
    trigger?: string;
  };
  min?: number;
  max?: number;
}

interface ZoomState {
  isLatestVisible: boolean;
  visiblePeriods: number;
  minDate: Date | null;
  maxDate: Date | null;
}

const WebViewChart: React.FC<WebViewChartProps> = ({
  data,
  options = {},
  width,
  height,
  onChartReady,
  onPointClick,
  onPointLongPress,
  onZoomLevelChange,
  onZoomStateChange,
  onWebViewRef,
  style,
  showSkeleton = true,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastZoomStateRef = useRef<ZoomState | null>(null);

  const chartId = useMemo(() => `chart-${Date.now()}`, []);
  const htmlContent = useMemo(
    () => generateHTMLTemplate(chartId, options),
    [chartId, options]
  );

  const seriesData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    const firstSeries = data[0] as { data?: unknown };
    if (firstSeries && Array.isArray(firstSeries.data)) {
      return firstSeries.data as Array<{ x?: number | string }>;
    }
    return [];
  }, [data]);

  // Helper function to calculate zoom state
  const calculateZoomState = useCallback(
    (min: number, max: number) => {
      if (!seriesData.length || !options.periodType) {
        return {
          isLatestVisible: true,
          visiblePeriods: 7,
          minDate: null,
          maxDate: null,
        };
      }

      const now = new Date().getTime();
      const isLatestVisible = now >= min && now <= max;

      const visiblePeriods = Math.round(
        calculateVisiblePeriods(min, max, options.periodType)
      );

      // Find first and last dates with data within the visible range
      let minTime = Number.POSITIVE_INFINITY;
      let maxTime = Number.NEGATIVE_INFINITY;

      for (const point of seriesData) {
        const pointX = point?.x;
        if (pointX == null) continue;
        const pointTime =
          typeof pointX === "number" ? pointX : new Date(pointX).getTime();
        if (Number.isNaN(pointTime)) continue;
        if (pointTime < min || pointTime > max) continue;
        if (pointTime < minTime) minTime = pointTime;
        if (pointTime > maxTime) maxTime = pointTime;
      }

      const minDate =
        minTime !== Number.POSITIVE_INFINITY ? new Date(minTime) : null;
      const maxDate =
        maxTime !== Number.NEGATIVE_INFINITY ? new Date(maxTime) : null;

      return {
        isLatestVisible,
        visiblePeriods,
        minDate,
        maxDate,
      };
    },
    [options.periodType, seriesData]
  );

  const emitZoomState = useCallback(
    (zoomState: ZoomState) => {
      const lastZoomState = lastZoomStateRef.current;
      const hasChanged =
        !lastZoomState ||
        lastZoomState.isLatestVisible !== zoomState.isLatestVisible ||
        lastZoomState.visiblePeriods !== zoomState.visiblePeriods ||
        lastZoomState.minDate?.getTime() !== zoomState.minDate?.getTime() ||
        lastZoomState.maxDate?.getTime() !== zoomState.maxDate?.getTime();

      if (!hasChanged) return;

      lastZoomStateRef.current = zoomState;
      onZoomStateChange && onZoomStateChange(zoomState);
    },
    [onZoomStateChange]
  );

  // Determine loading states
  const isLoading = !isChartReady || !data || data.length === 0;
  const skeletonType: ChartType = options.type === "pie" ? "pie" : "bar";

  const updateChartData = useCallback(() => {
    if (!webViewRef.current || !isChartReady) return;

    // Data is already in Highcharts format
    const updateScript = `
      window.updateChart(${JSON.stringify(data)});
      true;
    `;

    webViewRef.current.injectJavaScript(updateScript);
  }, [data, isChartReady]);

  useEffect(() => {
    if (isChartReady && data) {
      updateChartData();
    }
  }, [data, isChartReady, updateChartData]);

  // Fade animation for smooth transition
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: CHART_STYLING.ANIMATION.FADE_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isLoading, fadeAnim]);

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message: ChartMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case "chartReady":
          setIsChartReady(true);
          if (onChartReady) {
            onChartReady();
          }
          break;

        case "selection":
          if (message.data) {
            const { min, max, timestamp } = message.data;
          }
          break;

        case "setExtremes":
          if (message.data) {
            const { min, max, trigger, timestamp } = message.data;

            // Trigger zoom level change callback for pan/zoom events
            if (trigger && trigger !== "navigator") {
              onZoomLevelChange &&
                onZoomLevelChange("normal", min || 0, max || 0);
            }

            // Calculate and emit zoom state
            if (min != null && max != null) {
              const zoomState = calculateZoomState(min, max);
              emitZoomState(zoomState);
            }
          }
          break;

        default:
          break;
      }
    } catch (error) {
      // Error parsing chart message - could be logged in development
    }
  };

  const handleWebViewLoad = () => {
    if (data) {
      setTimeout(() => {
        updateChartData();
      }, 5);
    }
  };

  const defaultHeight =
    options.type === "pie"
      ? CHART_DIMENSIONS.DEFAULT_HEIGHT.PIE
      : CHART_DIMENSIONS.DEFAULT_HEIGHT.BAR;

  const webViewStyle = {
    width: width || "100%",
    height: height || defaultHeight,
    backgroundColor: "transparent",
    maxWidth: "100%" as const,
    overflow: "hidden" as const,
    marginHorizontal: width ? 0 : CHART_DIMENSIONS.CONTAINER_MARGIN,
  };

  return (
    <View style={[styles.container, webViewStyle, style]}>
      {/* Show skeleton while loading */}
      {isLoading && showSkeleton && (
        <ChartSkeleton
          type={skeletonType}
          width={width}
          height={height || defaultHeight}
          style={styles.skeleton}
        />
      )}

      {/* WebView with fade animation */}
      <Animated.View style={[styles.webViewContainer, { opacity: fadeAnim }]}>
        <WebView
          ref={(ref) => {
            webViewRef.current = ref;
            onWebViewRef?.(ref);
          }}
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          onLoad={handleWebViewLoad}
          onContentProcessDidTerminate={() => {
            webViewRef.current?.reload();
          }}
          scrollEnabled={false}
          bounces={false}
          scalesPageToFit={Platform.OS === "android"}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={["*"]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    overflow: "hidden",
    maxWidth: "100%",
    position: "relative",
    marginTop: dynamicScale(CHART_DIMENSIONS.CONTAINER_MARGIN_TOP),
  },
  skeleton: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    maxHeight: CHART_DIMENSIONS.DEFAULT_HEIGHT.BAR + dynamicScale(80),
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  webView: {
    backgroundColor: "transparent",
    flex: 1,
    overflow: "hidden",
    maxWidth: "100%",
  },
});

export default WebViewChart;
export { ChartData, ChartOptions };
