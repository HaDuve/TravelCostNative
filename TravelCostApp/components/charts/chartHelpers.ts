import { CHART_SPACING } from "./chartConstants";

export interface ChartData {
  x: string | number;
  y: number;
  color?: string;
  label?: string;
  [key: string]: unknown;
}

export interface ChartOptions {
  title?: string;
  subtitle?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  type?: "line" | "bar" | "column" | "pie" | "area";
  colors?: string[];
  showLegend?: boolean;
  enableZoom?: boolean;
  dateFormat?: boolean;
  currency?: string;
  zoomType?: string;
  pinchType?: string;
  panning?: boolean;
  panKey?: string;
}

export const generateHTMLTemplate = (
  chartId: string,
  options: ChartOptions = {}
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta charset="utf-8">
        <script src="https://code.highcharts.com/highcharts.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: transparent;
          }
          #${chartId} {
            width: 100%;
            height: 100%;
            background: transparent;
          }
          .highcharts-container {
            position: relative !important;
          }
          .highcharts-credits {
            display: none !important;
          }
          /* Make all Highcharts text elements non-selectable */
          .highcharts-container * {
            -webkit-user-select: none;
            user-select: none;
          }
        </style>
      </head>
      <body>
        <div id="${chartId}"></div>
        <script>
          let chart;

          const defaultOptions = {
            chart: {
              renderTo: '${chartId}',
              type: '${options.type || "line"}',
              backgroundColor: 'transparent',
              animation: {
                duration: 1000
              },
              style: {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              },
              spacingLeft: ${options.type === "pie" ? CHART_SPACING.PIE.LEFT : CHART_SPACING.BAR.LEFT},
              spacingRight: ${options.type === "pie" ? CHART_SPACING.PIE.RIGHT : CHART_SPACING.BAR.RIGHT},
              spacingTop: ${options.type === "pie" ? CHART_SPACING.PIE.TOP : CHART_SPACING.BAR.TOP},
              spacingBottom: ${options.type === "pie" ? CHART_SPACING.PIE.BOTTOM : CHART_SPACING.BAR.BOTTOM}
            },
            title: {
              text: '${options.title || ""}',
              style: {
                fontSize: '16px',
                fontWeight: 'bold'
              }
            },
            subtitle: {
              text: '${options.subtitle || ""}'
            },
            credits: {
              enabled: false
            },
            exporting: {
              enabled: false
            },
            legend: {
              enabled: ${options.showLegend || false}
            },
            tooltip: {
              enabled: false,
              animation: true,
              borderRadius: 8,
              shadow: true
            },
            chart: {
              renderTo: '${chartId}',
              type: '${options.type || "line"}',
              backgroundColor: 'transparent',
              animation: {
                duration: 1000
              },
              style: {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              },
              spacingLeft: ${options.type === "pie" ? CHART_SPACING.PIE.LEFT : CHART_SPACING.BAR.LEFT},
              spacingRight: ${options.type === "pie" ? CHART_SPACING.PIE.RIGHT : CHART_SPACING.BAR.RIGHT},
              spacingTop: ${options.type === "pie" ? CHART_SPACING.PIE.TOP : CHART_SPACING.BAR.TOP},
              spacingBottom: ${options.type === "pie" ? CHART_SPACING.PIE.BOTTOM : CHART_SPACING.BAR.BOTTOM},
              zoomType: 'x',
              pinchType: 'x',
              panning: true,
              panKey: 'shift',
              resetZoomButton: {
                position: {
                  align: 'right',
                  verticalAlign: 'top',
                  x: -10,
                  y: 10
                },
                theme: {
                  fill: 'white',
                  stroke: '#6B7280',
                  r: 4,
                  states: {
                    hover: {
                      fill: '#F3F4F6',
                      stroke: '#4B5563',
                      style: {
                        color: '#4B5563'
                      }
                    }
                  },
                  style: {
                    color: '#6B7280'
                  }
                }
              },
              events: {
                load: function() {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'chartReady'
                    }));
                  }
                },
                selection: function(event) {
                  if (!event.xAxis) {
                    return false;
                  }

                  const xAxis = event.xAxis[0];
                  const currentAxis = this.xAxis[0];
                  const totalRange = currentAxis.dataMax - currentAxis.dataMin;
                  const selectedRange = xAxis.max - xAxis.min;
                  const zoomRatio = totalRange / selectedRange;

                  // Calculate days in range
                  const daysInRange = selectedRange / (24 * 3600 * 1000);

                  // Prevent zooming if it would show fewer than 4 days
                  if (daysInRange < 4) {
                    return false;
                  }

                  // Log and notify when max zoom out is reached
                  // Send zoom event
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'zoom',
                      data: {
                        min: xAxis.min,
                        max: xAxis.max,
                        daysInRange,
                        zoomRatio
                      }
                    }));
                  }

                  // Prevent zooming beyond limits
                  if (daysInRange >= 27 || daysInRange < 4) {
                    return false;
                  }

                  // Let Highcharts handle the zoom
                  return true;
                },
                afterSetExtremes: function(e) {
                  if (!e.min || !e.max) return;

                  const daysInRange = (e.max - e.min) / (24 * 3600 * 1000);

                  // Log and notify when max zoom out is reached
                  // Send zoom event
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'zoom',
                      data: {
                        min: e.min,
                        max: e.max,
                        daysInRange
                      }
                    }));
                  }
                  }
                }
              }
            },
            xAxis: {
              title: {
                text: '${options.xAxisTitle || ""}'
              },
              type: ${options.dateFormat ? "'datetime'" : "'category'"},
              minPadding: 0.1,
              maxPadding: 0.1,
              minRange: 4 * 24 * 3600 * 1000, // Minimum range is 4 days
              maxRange: 27 * 24 * 3600 * 1000 // Maximum range is 27 days
            },
            yAxis: {
              title: {
                text: '${options.yAxisTitle || ""}'
              },
              labels: {
                formatter: function() {
                  return this.value + '${
                    options.currency ? " " + options.currency : ""
                  }';
                }
              }
            },
            plotOptions: {
              series: {
                animation: {
                  duration: 1000
                },
              },
              pie: {
                size: '90%',
                center: ['50%', '50%'],
                dataLabels: {
                  enabled: false,
                  useHTML: true
                }
              },
              column: {
                pointWidth: 25,
                borderRadius: 4,
                groupPadding: 0.1,
                pointPadding: 0.1,
                dataLabels: {
                  enabled: false,
                  style: {
                    fontSize: '12px',
                    fontWeight: 'normal',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    textOutline: '1px contrast'
                  },
                  formatter: function() {
                    return this.y.toFixed(2) + '${
                      options.currency ? " " + options.currency : "€"
                    }';
                  }
                }
              }
            },
            series: []
          };

          function initChart(data, customOptions = {}) {
            const mergedOptions = {
              ...defaultOptions,
              ...customOptions,
              series: data
            };

            if (chart) {
              chart.destroy();
            }

            chart = Highcharts.chart(mergedOptions);

            // Notify React Native that chart is ready
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'chart-ready'
              }));
            }
          }

          function updateChart(newData) {
            if (chart && newData) {
              if (Array.isArray(newData)) {
                newData.forEach((seriesData, index) => {
                  if (chart.series[index]) {
                    chart.series[index].setData(seriesData.data, false);
                  } else {
                    chart.addSeries(seriesData, false);
                  }
                });
                chart.redraw();
              }
            }
          }

          function setExtremes(min, max) {
            if (chart && chart.xAxis && chart.xAxis[0]) {
              chart.xAxis[0].setExtremes(min, max);
            }
          }

          function toggleLabels(show) {
            if (chart && chart.series) {
              chart.series.forEach((series, index) => {
                if (series.type === 'pie') {
                  // Pie chart labels
                  series.update({
                    dataLabels: {
                      enabled: show,
                      useHTML: true,
                      style: {
                        fontSize: '12px',
                        fontWeight: 'normal',
                        whiteSpace: 'normal',
                        textOverflow: 'none',
                        textAlign: 'center'
                      },
                      distance: 10,
                      allowOverlap: true,
                      crop: false
                    }
                  }, false);
                } else if (series.type === 'column') {
                  // Bar chart labels
                  series.update({
                    dataLabels: {
                      enabled: show,
                      style: {
                        fontSize: '12px',
                        fontWeight: 'normal',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        textOutline: '1px contrast'
                      },
                      formatter: function() {
                        return this.y.toFixed(2) + '${
                          options.currency ? " " + options.currency : "€"
                        }';
                      }
                    }
                  }, false);
                }
              });
              chart.redraw();
            }
          }

          // Make functions available globally
          window.initChart = initChart;
          window.updateChart = updateChart;
          window.setExtremes = setExtremes;
          window.toggleLabels = toggleLabels;

          // Initial chart creation with empty data and zoom
          initChart([]);

          // Set initial zoom level after a short delay to ensure chart is ready
          setTimeout(() => {
            if (chart && chart.xAxis && chart.xAxis[0]) {
              const now = new Date().getTime();
              const sevenDaysAgo = now - (7 * 24 * 3600 * 1000);
              chart.xAxis[0].setExtremes(sevenDaysAgo, now);
            }
          }, 100);
        </script>
      </body>
    </html>
  `;
};

export const formatDataForHighcharts = (
  data: ChartData[],
  options: ChartOptions = {}
): unknown[] => {
  if (!data || data.length === 0) {
    return [];
  }

  if (options.type === "pie") {
    return [
      {
        name: "Data",
        colorByPoint: true,
        data: data.map((item) => ({
          name: item.label || item.x,
          y: item.y,
          color: item.color,
        })),
      },
    ];
  }

  return [
    {
      name: "Series 1",
      data: data.map((item) => ({
        x: options.dateFormat ? new Date(item.x).getTime() : item.x,
        y: item.y,
        color: item.color,
        ...item,
      })),
      color: options.colors?.[0],
    },
  ];
};

export const createBarChartData = (
  data: ChartData[],
  colors?: { primary: string; error: string; budget: string }
): unknown[] => {
  const series = [];

  // Bar data
  series.push({
    name: "Expenses",
    type: "column",
    data: data.map((item) => ({
      x: item.x,
      y: item.y,
      color: item.color || colors?.primary,
      ...item,
    })),
    animation: {
      duration: 1000,
    },
  });

  return series;
};

export const createPieChartData = (data: ChartData[]): unknown[] => {
  return [
    {
      name: "Categories",
      colorByPoint: true,
      data: data.map((item) => {
        const label = item.label || String(item.x);
        // Split label into category name and currency value
        const parts = label.split(" ");
        const categoryName = parts[0];
        const currencyValue = parts.slice(1).join(" ");

        return {
          name: `${categoryName}<br/><span style="white-space: nowrap;">${currencyValue}</span>`,
          y: item.y,
          color: item.color,
        };
      }),
    },
  ];
};
