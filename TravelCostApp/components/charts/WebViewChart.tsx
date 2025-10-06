import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";

import { ChartData, ChartOptions, generateHTMLTemplate } from "./chartHelpers";

interface WebViewChartProps {
  data: any[]; // Highcharts series data format
  options?: ChartOptions;
  width?: number;
  height?: number;
  onChartReady?: () => void;
  onPointClick?: (data: any) => void;
  onPointLongPress?: (data: any) => void;
  style?: any;
}

interface ChartMessage {
  type: string;
  data?: any;
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
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showLabels, setShowLabels] = useState(false);

  const chartId = useMemo(() => `chart-${Date.now()}`, []);
  const htmlContent = useMemo(
    () => generateHTMLTemplate(chartId, options),
    [chartId, options]
  );

  useEffect(() => {
    if (isChartReady && data) {
      updateChartData();
    }
  }, [data, isChartReady]);

  const updateChartData = () => {
    if (!webViewRef.current || !isChartReady) return;

    // Data is already in Highcharts format
    const updateScript = `
      window.updateChart(${JSON.stringify(data)});
      true;
    `;

    webViewRef.current.injectJavaScript(updateScript);
  };

  const toggleLabels = () => {
    if (!webViewRef.current || !isChartReady) return;

    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newShowLabels = !showLabels;
    setShowLabels(newShowLabels);

    const toggleScript = `
      window.toggleLabels(${newShowLabels});
      true;
    `;

    webViewRef.current.injectJavaScript(toggleScript);
  };

  const setChartExtremes = (min: number, max: number) => {
    if (!webViewRef.current || !isChartReady) return;

    const extremesScript = `
      window.setExtremes(${min}, ${max});
      true;
    `;

    webViewRef.current.injectJavaScript(extremesScript);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message: ChartMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case "chart-ready":
          setIsChartReady(true);
          if (onChartReady) {
            onChartReady();
          }
          break;

        case "point-click":
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);

            // Handle single tap
            if (onPointClick && message.data) {
              onPointClick(message.data);
            }
          } else {
            // Start long press timer
            const timer = setTimeout(() => {
              if (onPointLongPress && message.data) {
                onPointLongPress(message.data);
              }
              setLongPressTimer(null);
            }, 500); // 500ms for long press

            setLongPressTimer(timer);
          }
          break;

        case "zoom":
          // Handle zoom events if needed
          break;

        default:
          console.log("Unknown chart message:", message);
      }
    } catch (error) {
      console.error("Error parsing chart message:", error);
    }
  };

  const handleWebViewLoad = () => {
    // Initial data load after WebView is ready
    if (data) {
      setTimeout(() => {
        updateChartData();
      }, 100);
    }
  };

  // Increase height for pie charts to give more space
  const defaultHeight = options.type === "pie" ? 300 : 200;

  const webViewStyle = {
    width: width || "100%",
    height: height || defaultHeight,
    backgroundColor: "transparent",
    maxWidth: "100%",
    overflow: "hidden",
    marginHorizontal: width ? 0 : 16, // Add padding when using full width
    ...style,
  };

  return (
    <TouchableOpacity
      style={[styles.container, webViewStyle]}
      onPress={toggleLabels}
      activeOpacity={0.9}
    >
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        onLoad={handleWebViewLoad}
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
        pointerEvents="none"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    maxWidth: "100%",
    overflow: "hidden",
  },
  webView: {
    backgroundColor: "transparent",
    flex: 1,
    maxWidth: "100%",
    overflow: "hidden",
  },
});

export default WebViewChart;
export { ChartData, ChartOptions };
