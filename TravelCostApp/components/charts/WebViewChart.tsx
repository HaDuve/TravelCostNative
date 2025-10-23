import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { StyleSheet, Platform, View, Animated } from "react-native";
import { WebView } from "react-native-webview";
import { generateHTMLTemplate, ChartData, ChartOptions } from "./chartHelpers";
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

const WebViewChart = React.forwardRef<WebView, WebViewChartProps>(
  function WebViewChart(props, ref) {
    const {
      data,
      options = {},
      width,
      height,
      onChartReady,
      onPointClick,
      onPointLongPress,
      onZoomLevelChange,
      style,
      showSkeleton = true,
    } = props;
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
            }
            break;

          case "zoom":
            if (message.data) {
              const { min, max, daysInRange } = message.data;
              console.log("📊 Zoom event:", { daysInRange, min, max });

              if (daysInRange >= 27) {
                console.log("📊 Max zoom out reached");
              } else if (daysInRange <= 4) {
                console.log("📊 Max zoom in reached");
              }

              onZoomLevelChange &&
                onZoomLevelChange(
                  daysInRange >= 27
                    ? "max"
                    : daysInRange <= 4
                      ? "min"
                      : "normal",
                  min || 0,
                  max || 0
                );
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
            ref={ref || webViewRef}
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
  }
);

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
