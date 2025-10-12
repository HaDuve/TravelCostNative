/**
 * Chart Constants
 *
 * Centralized constants for chart spacing, dimensions, and styling
 * to ensure consistency between WebViewChart and ChartSkeleton components
 */

// HighCharts spacing configuration
export const CHART_SPACING = {
  // Bar chart spacing (matches HighCharts spacingLeft/Right/Top/Bottom)
  BAR: {
    LEFT: 20,
    RIGHT: 20,
    TOP: 20,
    BOTTOM: 20,
  },
  // Pie chart spacing (matches HighCharts spacingLeft/Right/Top/Bottom)
  PIE: {
    LEFT: 0,
    RIGHT: 0,
    TOP: 0,
    BOTTOM: 0,
  },
} as const;

// Chart dimensions
export const CHART_DIMENSIONS = {
  // Default heights for different chart types
  DEFAULT_HEIGHT: {
    BAR: 200,
    PIE: 300,
  },
  // Container margins (matches WebViewChart marginHorizontal behavior)
  CONTAINER_MARGIN: 16,
  // Container top margin (matches WebViewChart marginTop)
  CONTAINER_MARGIN_TOP: 8,
} as const;

// Chart styling constants
export const CHART_STYLING = {
  // Colors for skeleton elements
  SKELETON_COLORS: {
    BACKGROUND: "#F2F2F2", // GlobalStyles.colors.gray300
    ELEMENT: "#DCDCDC", // GlobalStyles.colors.gray500
    TEXT: "#BFBFBF", // GlobalStyles.colors.gray600
  },
  // Animation durations
  ANIMATION: {
    FADE_DURATION: 300,
    SHIMMER_DURATION: 300,
  },
  // Border radius for skeleton elements
  BORDER_RADIUS: {
    SMALL: 2,
    MEDIUM: 4,
  },
} as const;

// Bar chart specific constants
export const BAR_CHART_CONSTANTS = {
  // Bar heights as percentages (matches screenshot pattern)
  BAR_HEIGHTS: [0.85, 0.35, 0.35, 0.35, 0.55, 0.5, 0.35],
  // Y-axis values
  Y_AXIS_VALUES: [0, 10, 20, 30, 40, 50, 60],
  // X-axis labels (example dates)
  X_AXIS_LABELS: [
    "6. Okt.",
    "7. Okt.",
    "8. Okt.",
    "9. Okt.",
    "10. Okt.",
    "11. Okt.",
    "12. Okt.",
  ],
  // Grid lines count
  GRID_LINES_COUNT: 6,
} as const;

// Pie chart specific constants
export const PIE_CHART_CONSTANTS = {
  // Default pie chart size calculation
  DEFAULT_SIZE: 200,
  // Minimum size to ensure readability
  MIN_SIZE: 100,
  // HighCharts pie chart size percentage (matches plotOptions.pie.size)
  SIZE_PERCENTAGE: 0.9,
} as const;

// Helper functions for chart calculations
export const ChartCalculations = {
  /**
   * Calculate available chart area dimensions after accounting for spacing
   */
  getChartAreaDimensions: (
    width: number,
    height: number,
    chartType: "bar" | "pie"
  ) => {
    const spacing = chartType === "pie" ? CHART_SPACING.PIE : CHART_SPACING.BAR;

    return {
      width: width - spacing.LEFT - spacing.RIGHT,
      height: height - spacing.TOP - spacing.BOTTOM,
    };
  },

  /**
   * Calculate pie chart size accounting for spacing and HighCharts size percentage
   */
  getPieSize: (width: number, height: number) => {
    const minDimension = Math.min(width, height);
    const pieSpacing = CHART_SPACING.PIE.LEFT + CHART_SPACING.PIE.RIGHT;
    const availableSize = Math.max(
      minDimension - pieSpacing,
      PIE_CHART_CONSTANTS.MIN_SIZE
    );
    return availableSize * PIE_CHART_CONSTANTS.SIZE_PERCENTAGE;
  },

  /**
   * Calculate bar positions for skeleton
   */
  getBarPositions: (chartAreaWidth: number, barCount: number) => {
    return Array.from({ length: barCount }, (_, index) => ({
      left:
        (index * chartAreaWidth) / barCount + chartAreaWidth / (barCount * 2),
      width: (chartAreaWidth / barCount) * 0.6, // 60% of segment width
    }));
  },

  /**
   * Calculate grid line positions
   */
  getGridLinePositions: (chartAreaHeight: number, gridCount: number) => {
    return Array.from({ length: gridCount }, (_, index) => ({
      top: (index * chartAreaHeight) / gridCount,
    }));
  },
} as const;

// Type definitions for better TypeScript support
export type ChartType = "bar" | "pie";
export type ChartSpacing = typeof CHART_SPACING.BAR | typeof CHART_SPACING.PIE;
export type ChartDimensions = typeof CHART_DIMENSIONS.DEFAULT_HEIGHT;
