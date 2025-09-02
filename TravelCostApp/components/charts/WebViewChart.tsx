import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { 
  generateHTMLTemplate, 
  ChartData, 
  ChartOptions 
} from './chartHelpers';

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
  style
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const chartId = `chart-${Date.now()}`;

  const htmlContent = generateHTMLTemplate(chartId, options);

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
        case 'chart-ready':
          setIsChartReady(true);
          if (onChartReady) {
            onChartReady();
          }
          break;
          
        case 'point-click':
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
          
        case 'zoom':
          // Handle zoom events if needed
          break;
          
        default:
          console.log('Unknown chart message:', message);
      }
    } catch (error) {
      console.error('Error parsing chart message:', error);
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

  const webViewStyle = {
    width: width || '100%',
    height: height || 200,
    backgroundColor: 'transparent',
    ...style
  };

  return (
    <View style={[styles.container, webViewStyle]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        onLoad={handleWebViewLoad}
        scrollEnabled={false}
        bounces={false}
        scalesPageToFit={Platform.OS === 'android'}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  webView: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});

export default WebViewChart;
export { ChartData, ChartOptions };