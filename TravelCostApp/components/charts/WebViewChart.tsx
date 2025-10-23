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

  const chartId = useMemo(() => `chart-${Date.now()}`, []);
  const htmlContent = useMemo(
    () => generateHTMLTemplate(chartId, options),
    [chartId, options]
  );

  // Helper function to calculate zoom state
  const calculateZoomState = useCallback(
    (min: number, max: number) => {
      if (!data || data.length === 0 || !options.periodType) {
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
      let minDate: Date | null = null;
      let maxDate: Date | null = null;

      // Extract data points from the series data
      const seriesData =
        Array.isArray(data) && data[0] && "data" in data[0]
          ? (data[0] as any).data
          : [];

      if (Array.isArray(seriesData)) {
        const visibleDataPoints = seriesData.filter((point: any) => {
          const pointTime =
            typeof point.x === "number" ? point.x : new Date(point.x).getTime();
          return pointTime >= min && pointTime <= max;
        });

        if (visibleDataPoints.length > 0) {
          const sortedPoints = visibleDataPoints.sort((a: any, b: any) => {
            const timeA =
              typeof a.x === "number" ? a.x : new Date(a.x).getTime();
            const timeB =
              typeof b.x === "number" ? b.x : new Date(b.x).getTime();
            return timeA - timeB;
          });

          minDate = new Date(sortedPoints[0].x);
          maxDate = new Date(sortedPoints[sortedPoints.length - 1].x);
        }
      }

      return {
        isLatestVisible,
        visiblePeriods,
        minDate,
        maxDate,
      };
    },
    [data, options.periodType]
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
      console.log("🚀 ~ handleWebViewMessage ~ message:", message);

      switch (message.type) {
        case "chartReady":
          setIsChartReady(true);
          if (onChartReady) {
            onChartReady();
          }
          console.log("📊 Chart ready");
          break;

        case "selection":
          if (message.data) {
            const { min, max, timestamp } = message.data;
            console.log("📊 Selection event (drag selection):", {
              min,
              max,
              timestamp,
            });
          }
          break;

        case "setExtremes":
          if (message.data) {
            const { min, max, trigger, timestamp } = message.data;
            console.log("📊 Set extremes event (pinch/pan/zoom):", {
              min,
              max,
              trigger,
              timestamp,
            });

            // Trigger zoom level change callback for pan/zoom events
            if (trigger && trigger !== "navigator") {
              console.log("🔄 Zoom level change callback triggered:", {
                min,
                max,
                trigger,
                timestamp,
              });
              onZoomLevelChange &&
                onZoomLevelChange("normal", min || 0, max || 0);
            }

            // Calculate and emit zoom state
            if (min != null && max != null) {
              const zoomState = calculateZoomState(min, max);
              console.log("📊 Zoom state calculated:", zoomState);
              onZoomStateChange && onZoomStateChange(zoomState);
            }
          }
          break;

        default:
          console.log("📊 Chart message:", message.type, message.data);
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
