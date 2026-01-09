import { ExpenseData } from "../../util/expense";
import { CategoryData } from "./controller";

/**
 * Base structure for chart point data from Highcharts
 */
export interface BaseChartPointData {
  x: string | number;
  y: number;
  name?: string;
  color?: string;
  originalData?: unknown;
}

/**
 * Original data structure for bar chart points
 */
export interface BarChartOriginalData {
  day?: string; // ISO date string for day period
  firstDay?: string; // ISO date string for week/month/year periods
  lastDay?: string; // ISO date string for week/month/year periods
  expensesSum: number;
  dailyBudget?: string;
  weeklyBudget?: number;
  monthlyBudget?: number;
  yearlyBudget?: number;
  label?: string;
}

/**
 * Point data structure for bar chart click events
 */
export interface BarChartPointData extends BaseChartPointData {
  originalData?: BarChartOriginalData;
}

/**
 * Point data structure for pie chart click events
 */
export interface PieChartPointData extends BaseChartPointData {
  originalData?: CategoryData;
}

/**
 * Union type for all chart point data
 */
export type ChartPointData = BarChartPointData | PieChartPointData;

/**
 * Navigation prop interface for React Navigation
 */
export interface NavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  goBack?: () => void;
}

