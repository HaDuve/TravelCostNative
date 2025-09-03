export interface ChartData {
  x: string | number;
  y: number;
  color?: string;
  label?: string;
  [key: string]: any;
}

export interface ChartOptions {
  title?: string;
  subtitle?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  type?: 'line' | 'bar' | 'column' | 'pie' | 'area';
  colors?: string[];
  showLegend?: boolean;
  enableZoom?: boolean;
  dateFormat?: boolean;
  currency?: string;
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
        </style>
      </head>
      <body>
        <div id="${chartId}"></div>
        <script>
          let chart;
          
          const defaultOptions = {
            chart: {
              renderTo: '${chartId}',
              type: '${options.type || 'line'}',
              backgroundColor: 'transparent',
              animation: {
                duration: 1000
              },
              style: {
                fontFamily: 'System'
              },
              spacingLeft: 20,
              spacingRight: 20
            },
            title: {
              text: '${options.title || ''}',
              style: {
                fontSize: '16px',
                fontWeight: 'bold'
              }
            },
            subtitle: {
              text: '${options.subtitle || ''}'
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
              enabled: true,
              animation: true,
              borderRadius: 8,
              shadow: true
            },
            xAxis: {
              title: {
                text: '${options.xAxisTitle || ''}'
              },
              type: ${options.dateFormat ? "'datetime'" : "'category'"}
            },
            yAxis: {
              title: {
                text: '${options.yAxisTitle || ''}'
              },
              labels: {
                formatter: function() {
                  return this.value + '${options.currency ? ' ' + options.currency : ''}';
                }
              }
            },
            plotOptions: {
              series: {
                animation: {
                  duration: 1000
                },
                point: {
                  events: {
                    click: function() {
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'point-click',
                          data: this.options
                        }));
                      }
                    }
                  }
                }
              },
              column: {
                pointWidth: 25,
                borderRadius: 4,
                groupPadding: 0.1,
                pointPadding: 0.1
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

          // Make functions available globally
          window.initChart = initChart;
          window.updateChart = updateChart;
          window.setExtremes = setExtremes;
          
          // Initial chart creation with empty data
          initChart([]);
        </script>
      </body>
    </html>
  `;
};

export const formatDataForHighcharts = (
  data: ChartData[],
  options: ChartOptions = {}
): any[] => {
  if (!data || data.length === 0) {
    return [];
  }

  if (options.type === 'pie') {
    return [{
      name: 'Data',
      colorByPoint: true,
      data: data.map(item => ({
        name: item.label || item.x,
        y: item.y,
        color: item.color
      }))
    }];
  }

  return [{
    name: 'Series 1',
    data: data.map(item => ({
      x: options.dateFormat ? new Date(item.x).getTime() : item.x,
      y: item.y,
      color: item.color,
      ...item
    })),
    color: options.colors?.[0]
  }];
};

export const createBarChartData = (
  data: ChartData[],
  budgetLine?: number,
  colors?: { primary: string; error: string; budget: string }
): any[] => {
  const series = [];
  
  // Bar data
  series.push({
    name: 'Expenses',
    type: 'column',
    data: data.map(item => ({
      x: item.x,
      y: item.y,
      color: item.color || colors?.primary,
      ...item
    })),
    animation: {
      duration: 1000
    }
  });

  // Budget line
  if (budgetLine && data.length > 0) {
    const firstDate = data[0].x;
    const lastDate = data[data.length - 1].x;
    
    series.push({
      name: 'Budget',
      type: 'line',
      data: [
        { x: firstDate, y: budgetLine },
        { x: lastDate, y: budgetLine }
      ],
      color: colors?.budget || '#999999',
      dashStyle: 'ShortDash',
      marker: {
        enabled: false
      },
      enableMouseTracking: false
    });
  }

  return series;
};

export const createPieChartData = (
  data: ChartData[]
): any[] => {
  return [{
    name: 'Categories',
    colorByPoint: true,
    data: data.map(item => ({
      name: item.label || item.x,
      y: item.y,
      color: item.color
    }))
  }];
};