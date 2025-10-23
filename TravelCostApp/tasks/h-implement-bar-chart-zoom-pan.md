---
task: h-implement-bar-chart-zoom-pan
branch: feature/bar-chart-zoom-pan
status: in-progress
created: 2025-10-23
started: 2025-10-23
modules: [react-native, charts, webview, components]
---

# Implement Bar Chart Zoom and Pan

## Problem/Goal

Enhance the bar chart with zoom and pan functionality to provide better data exploration capabilities. The implementation should support different zoom levels and panning within those levels, making it easier for users to analyze their expense data across different time ranges.

## Success Criteria

- [ ] Remove existing day modification buttons
- [ ] Remove TouchableOpacity wrapper around WebView
- [ ] Implement zoom functionality with 4 distinct levels:
  - Days: 4-27 days visible
  - Weeks: 4-16 weeks visible (28-111 days)
  - Months: 4-48 months visible (112-1343 days)
  - Years: 4-30 years visible (1344-10800 days)
- [ ] Implement panning within each zoom level's data range
- [ ] Add reset button in header to return to 7-day view
- [ ] Ensure smooth transitions between zoom levels
- [ ] Maintain performance with large datasets
- [ ] Test functionality on both iOS and Android

## Context Files

- components/ExpensesOverview/ExpenseChart.tsx
- components/charts/WebViewChart.tsx
- components/charts/chartHelpers.ts

## Implementation Details

1. Highcharts Configuration:

```javascript
zoomType: 'x',
pinchType: 'x',
panning: true,
```

2. Zoom Levels:

- Days: 4-27 days
- Weeks: 28-111 days
- Months: 112-1343 days
- Years: 1344-10800 days

3. Header Layout:

- Self-aligned center
- Reset button in top right
- Reset returns to 7-day view with current day as latest point

## Notes

- Ensure smooth transitions between zoom levels
- Maintain performance with large datasets
- Consider memory usage with extended data ranges
- Implement proper error handling for edge cases
