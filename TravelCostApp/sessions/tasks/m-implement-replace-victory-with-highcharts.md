---
task: m-implement-replace-victory-with-highcharts
branch: feature/replace-victory-with-highcharts
status: pending
created: 2025-09-02
modules: [react-native, charts, webview, components]
---

# Replace Victory Charts with Highcharts

## Problem/Goal
Replace the current WIP chart placeholder components with a comprehensive Highcharts WebView implementation. Victory charts were removed during EAS migration and need to be replaced with a robust charting solution that provides full chart functionality while maintaining good performance.

## Success Criteria
- [ ] Create WebViewChart.tsx component that renders Highcharts in a WebView
- [ ] Implement controller.tsx with chart logic and data handling
- [ ] Create chartHelpers.ts utility functions for chart configuration
- [ ] Replace ExpenseChart.tsx WIP placeholder with Highcharts implementation
- [ ] Replace CategoryChart.tsx WIP placeholder with Highcharts implementation
- [ ] Implement bidirectional communication between WebView and React Native
- [ ] Support chart interactions (zoom, tap, long press)
- [ ] Handle time frame controls and data filtering
- [ ] Ensure proper WebView sizing and responsiveness
- [ ] Test chart functionality on both iOS and Android
- [ ] Remove WIPChart.tsx placeholder component

## Context Files
<!-- Added by context-gathering agent or manually -->
- components/WIPChart.tsx                           # Current placeholder component
- components/ExpensesOverview/ExpenseChart.tsx      # Expense chart implementation (currently using WIP)
- components/ExpensesOverview/CategoryChart.tsx     # Category chart implementation (currently using WIP)

## User Notes
<!-- Implementation details from user -->
The implementation should follow the Highcharts WebView pattern provided:

**Project Structure:**
- WebViewChart.tsx: Main component that renders the chart
- controller.tsx: Logic and data handling
- chartHelpers.ts: Utility functions for chart configuration

**Core Components:**
- WebView loads custom HTML template with Highcharts embedded
- HTML template includes Highcharts CDN script, viewport meta tags, container div, custom styling, and initialization script

**Data Flow & Communication:**
- WebView to React Native: Using window.ReactNativeWebView.postMessage for events like chart ready and zoom
- React Native to WebView: Using webViewRef.current.injectJavaScript() to update chart extremes and modify properties

**Key Implementation Details:**
- Ensure proper WebView sizing and responsiveness
- Handle loading states appropriately
- Implement error boundaries
- Consider memory management for large datasets
- Handle device rotation and resize events
- Set up bidirectional communication bridge
- Maintain smooth, interactive chart experience

The most important aspect is the bidirectional communication between React Native and the WebView using postMessage and injectJavaScript for seamless chart interaction.

## Work Log
- [2025-09-02] Task created after completing EAS migration and Victory chart removal