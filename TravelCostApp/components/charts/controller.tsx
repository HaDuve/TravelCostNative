import { ChartData, ChartOptions } from "./chartHelpers";

export interface ExpenseData {
  day?: string;
  firstDay?: string;
  lastDay?: string;
  expensesSum: number;
  dailyBudget?: number;
  weeklyBudget?: number;
  monthlyBudget?: number;
  yearlyBudget?: number;
  label?: string;
  fill?: string;
}

export interface CategoryData {
  x: string;
  y: number;
  color?: string;
}

export class ChartController {
  static processExpenseData(
    inputData: ExpenseData[],
    xAxis: string,
    yAxis: string,
    colors: { primary: string; error: string; gray: string }
  ): ChartData[] {
    if (!inputData || inputData.length === 0) {
      return [];
    }

    return inputData.map((item) => {
      const budgetCompare =
        item.dailyBudget ||
        item.weeklyBudget ||
        item.monthlyBudget ||
        item.yearlyBudget;

      let color = colors.gray;
      if (item.expensesSum > 0) {
        color =
          item.expensesSum > (budgetCompare || 0)
            ? colors.error
            : colors.primary;
      }

      return {
        x: item[xAxis as keyof ExpenseData] as string,
        y: item[yAxis as keyof ExpenseData] as number,
        label: item.label || (item[xAxis as keyof ExpenseData] as string),
        color,
        originalData: item,
      };
    });
  }

  static processCategoryData(inputData: CategoryData[]): ChartData[] {
    if (!inputData || inputData.length === 0) {
      return [];
    }

    return inputData.map((item) => ({
      x: item.x,
      y: item.y,
      label: item.x,
      color: item.color,
      originalData: item,
    }));
  }

  static createExpenseChartOptions(
    budget?: number,
    colors?: { primary: string; error: string; gray: string; budget: string },
    currency?: string
  ): ChartOptions {
    return {
      type: "column",
      title: "",
      xAxisTitle: "",
      yAxisTitle: "",
      enableZoom: true,
      showLegend: false,
      dateFormat: true,
      currency: currency,
      colors: colors ? [colors.primary] : undefined,
    };
  }

  static createCategoryChartOptions(): ChartOptions {
    return {
      type: "pie",
      title: "",
      showLegend: false,
      enableZoom: false,
    };
  }

  static getDateRange(
    data: ExpenseData[]
  ): { firstDate: Date; lastDate: Date } | null {
    if (!data || data.length === 0) {
      return null;
    }

    const firstItem = data[0];
    const lastItem = data[data.length - 1];

    const firstDate = new Date(firstItem.day || firstItem.firstDay || "");
    const lastDate = new Date(lastItem.day || lastItem.lastDay || "");

    return { firstDate, lastDate };
  }

  static formatDateLabel(dateString: string): string {
    const date = new Date(dateString);
    const day = date.toLocaleString("default", { day: "2-digit" });
    const month = date.toLocaleString("default", { month: "short" });
    return `${day} ${month}`;
  }

  static calculateBudgetStatus(
    expensesSum: number,
    budget: number,
    currency: string
  ): { isOverBudget: boolean; difference: number; message: string } {
    const difference = budget - expensesSum;
    const isOverBudget = difference < 0;

    const message = isOverBudget
      ? `Over budget: ${Math.abs(difference).toFixed(2)} ${currency}`
      : `Under budget: ${difference.toFixed(2)} ${currency}`;

    return {
      isOverBudget,
      difference,
      message,
    };
  }

  static filterExpensesByDate(expenses: any[], datum: ExpenseData): any[] {
    if (!expenses || !datum) {
      return [];
    }

    let filteredExpenses: any[] = [];

    if (datum.firstDay && datum.lastDay) {
      filteredExpenses = expenses.filter(
        (expense) =>
          expense.date >= datum.firstDay && expense.date <= datum.lastDay
      );
    } else if (datum.day) {
      filteredExpenses = expenses.filter((expense) =>
        this.isSameDay(expense.date, datum.day!)
      );
    }

    return filteredExpenses;
  }

  static isSameDay(date1: string | Date, date2: string | Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  static getChartDimensions(isLandscape: boolean): {
    width: number;
    height: number;
  } {
    const height = isLandscape ? 200 : 240;

    // Use most of available width with padding
    return {
      width: undefined, // Let container handle width
      height,
    };
  }
}
