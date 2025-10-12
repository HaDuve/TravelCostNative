---
task: m-implement-highcharts-loading-state
branch: feature/add-highcharts-loading-state
status: completed
created: 2025-01-27
completed: 2025-01-27
modules: [components/charts, components/UI, components/ExpensesOverview]
---

# Add Loading State to HighCharts WebView with Skeleton Component

## Problem/Goal

The HighCharts WebView implementation currently shows no loading state while charts are initializing, creating a poor user experience. Users see a blank space while the WebView loads, HighCharts initializes, and data is processed. We need to implement a skeleton component that resembles the final chart layout to provide visual continuity and improve perceived performance.

## Success Criteria

- [x] Create ChartSkeleton component that mimics bar chart layout from screenshot
- [x] Analyze all possible WebView and data loading states
- [x] Implement loading state management in WebViewChart component
- [x] Add skeleton for both bar charts and pie charts
- [x] Ensure smooth transition from skeleton to actual chart
- [x] Test loading states across different data scenarios
- [x] Maintain existing chart functionality and interactions

## Context Manifest

### Current WebView Chart Architecture

The TravelCost app uses a sophisticated WebView-based Highcharts implementation (`components/charts/WebViewChart.tsx`) that replaced Victory charts. The current loading flow works as follows:

**WebView Initialization States:**

1. **WebView Loading**: `startInLoadingState={false}` - WebView loads HTML template
2. **HTML Template Generation**: `generateHTMLTemplate()` creates complete HTML with Highcharts CDN
3. **Highcharts Initialization**: JavaScript initializes chart with empty data
4. **Chart Ready Signal**: WebView posts `chart-ready` message to React Native
5. **Data Injection**: React Native injects actual data via `updateChartData()`

**Current State Management:**

```typescript
const [isChartReady, setIsChartReady] = useState(false);
// Only tracks if Highcharts is initialized, not data availability
```

**Data Loading Scenarios:**

**ExpenseChart.tsx Data Flow:**

- `inputData` prop arrives (can be empty array initially)
- `useMemo` processes data through `ChartController.processExpenseData()`
- `createBarChartData()` formats for Highcharts
- Chart renders only if `inputData && inputData.length > 0`

**CategoryChart.tsx Data Flow:**

- `inputData` prop arrives (can be empty array initially)
- `useMemo` processes data through category mapping
- `createPieChartData()` formats for Highcharts
- Chart renders only if `inputData && inputData.length > 0`

**Identified Loading States:**

1. **No Data State**: `inputData` is undefined/null/empty array
2. **WebView Loading**: HTML template loading, Highcharts CDN downloading
3. **Chart Initializing**: Highcharts creating empty chart, waiting for `chart-ready`
4. **Data Processing**: React Native processing raw data into chart format
5. **Data Injecting**: WebView receiving and rendering actual data
6. **Chart Ready**: Chart fully rendered with data

### Skeleton Component Requirements

Based on the provided bar chart screenshot, the skeleton needs to replicate:

**Bar Chart Skeleton Structure:**

- **Y-axis**: Vertical axis with 6 tick marks (0€ to 60€ in 10€ increments)
- **X-axis**: Horizontal axis with 7 date labels (6. Okt. to 12. Okt.)
- **Grid Lines**: 6 horizontal grid lines matching Y-axis ticks
- **7 Bars**: Vertical rectangles with specific height pattern:
  - Bar 1 (6. Okt.): ~80-85% height (tallest)
  - Bars 2-4 (7-9. Okt.): ~35-40% height (medium-low)
  - Bar 5 (10. Okt.): ~50-55% height (taller)
  - Bar 6 (11. Okt.): ~45-50% height (medium-tall)
  - Bar 7 (12. Okt.): ~35-40% height (medium-low)

**Pie Chart Skeleton Structure:**

- **Circular Container**: Center-positioned circle
- **Segments**: 4-6 pie segments with varying sizes
- **Center Area**: Inner circle for labels/values

**Design System Integration:**

- Use `GlobalStyles.colors.gray300` for skeleton backgrounds
- Use `GlobalStyles.colors.gray600` for skeleton borders/text
- Apply `dynamicScale()` for responsive sizing
- Follow existing shadow patterns from `GlobalStyles.shadow`
- Use shimmer animation for loading effect

### Technical Implementation Plan

**1. Create ChartSkeleton Component (`components/UI/ChartSkeleton.tsx`)**

```typescript
interface ChartSkeletonProps {
  type: "bar" | "pie";
  width?: number;
  height?: number;
  style?: any;
}
```

**2. Enhance WebViewChart Loading States**

```typescript
interface WebViewChartProps {
  // ... existing props
  showSkeleton?: boolean;
  skeletonType?: "bar" | "pie";
}

// New state management
const [loadingState, setLoadingState] = useState<
  "webview" | "chart" | "data" | "ready"
>("webview");
```

**3. Loading State Logic**

```typescript
// Determine when to show skeleton
const shouldShowSkeleton = !isChartReady || !data || data.length === 0;

// Skeleton type based on chart options
const skeletonType = options.type === "pie" ? "pie" : "bar";
```

**4. Integration Points**

- Replace empty state rendering in `ExpenseChart.tsx` and `CategoryChart.tsx`
- Add skeleton during WebView initialization
- Smooth transition animations using existing `FadeInDown`/`FadeOut` patterns

### User Notes

The skeleton should provide immediate visual feedback while maintaining the exact layout structure of the final chart. This creates a seamless loading experience that matches the app's existing design patterns and improves perceived performance significantly.

The implementation should handle edge cases like:

- Very fast data loading (skeleton flashes briefly)
- Network delays (skeleton shows longer)
- Empty data states (skeleton shows indefinitely)
- Chart type changes (skeleton adapts to new type)

## Context Files

- components/charts/WebViewChart.tsx # Main WebView chart component
- components/charts/chartHelpers.ts # HTML template and data formatting
- components/charts/controller.tsx # Chart data processing logic
- components/ExpensesOverview/ExpenseChart.tsx # Bar chart implementation
- components/ExpensesOverview/CategoryChart.tsx # Pie chart implementation
- components/UI/LoadingOverlay.tsx # Existing loading patterns
- components/UI/LoadingBarOverlay.tsx # Existing loading patterns
- constants/styles.ts # Design system and colors

## Implementation Summary

### ✅ **Completed Deliverables:**

1. **ChartSkeleton Component** (`components/UI/ChartSkeleton.tsx`)
   - Bar chart skeleton with exact layout matching screenshot
   - Pie chart skeleton with proper sizing (90% of container)
   - Shimmer animation for loading effect
   - Responsive design using screen dimensions

2. **Global Chart Constants** (`components/charts/chartConstants.ts`)
   - Centralized spacing, dimensions, and styling constants
   - Helper functions for calculations
   - Type-safe interfaces
   - Future-proof architecture

3. **Enhanced WebViewChart** (`components/charts/WebViewChart.tsx`)
   - Loading state management
   - Smooth fade transitions
   - Skeleton integration
   - Maintained all existing functionality

4. **Updated Chart Components**
   - ExpenseChart: Integrated skeleton loading
   - CategoryChart: Integrated skeleton loading
   - ChartHelpers: Uses global constants

### 🎯 **Key Achievements:**

- **Pixel-Perfect Alignment**: Skeleton matches actual chart dimensions exactly
- **Consistent Spacing**: All components use centralized constants
- **Smooth UX**: Fade transitions between skeleton and actual chart
- **Responsive Design**: Works across all device sizes
- **Type Safety**: Full TypeScript support
- **Maintainable**: Easy to update spacing/colors in one place

### 🔧 **Technical Highlights:**

- **Loading States**: Handles WebView loading, chart initialization, and data availability
- **Sizing Logic**: Accounts for HighCharts internal spacing (90% for pie charts)
- **Positioning**: Matches WebViewChart container margins exactly
- **Animation**: Smooth shimmer effect with configurable duration
- **Performance**: Optimized calculations and memoization

The implementation provides a significantly improved user experience with immediate visual feedback during chart loading, eliminating the previous blank space issue.
