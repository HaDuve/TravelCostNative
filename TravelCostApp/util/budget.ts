import { GlobalStyles } from "../constants/styles";
import type { ExpenseData } from "./expense";
import { getExpensesSumPeriod } from "./expense";
import { DateTime } from "luxon";
import {
  getDateMinusDays,
  getDatePlusDays,
  getPreviousMondayDate,
} from "./date";

type PeriodName = "day" | "week" | "month" | "year";
type PeriodNameWithTotal = PeriodName | "total";

export type TripBudgetMeta = {
  readonly startDate: string;
};

function toJsDate(date: unknown): Date {
  if (date instanceof Date) return date;
  if (date instanceof DateTime) return date.toJSDate();
  // Fall back: treat as Date-like / ISO string.
  return new Date(date as string);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isEligibleExpense(
  exp: ExpenseData,
  {
    hideSpecial,
    maxDate,
  }: {
    hideSpecial: boolean;
    maxDate?: Date;
  }
): boolean {
  if (exp.isDeleted) return false;
  if (hideSpecial && exp.isSpecialExpense) return false;
  if (maxDate && toJsDate(exp.date).getTime() > maxDate.getTime()) return false;
  return true;
}

export function computeDynamicDailyBudget({
  totalBudget,
  tripTotalSpent,
  endDate,
  now,
}: {
  totalBudget: number;
  tripTotalSpent: number;
  endDate: Date;
  now: Date;
}): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / msPerDay);
  if (daysLeft <= 0) return 0;

  const remaining = totalBudget - tripTotalSpent;
  if (remaining <= 0) return 0;

  return remaining / daysLeft;
}

export function getBudgetColor(
  expensesSum: number,
  budget: number,
  averageDailySpending: number,
  dailyBudget: number,
  useTrafficLight: boolean
): string {
  if (!useTrafficLight) {
    return expensesSum > budget
      ? GlobalStyles.colors.error300
      : GlobalStyles.colors.primary500;
  }

  if (expensesSum <= budget) {
    return GlobalStyles.colors.primary500;
  }

  return averageDailySpending > dailyBudget
    ? GlobalStyles.colors.error300
    : GlobalStyles.colors.accent500;
}

/**
 * Calculates the daily average spending for a given period.
 * The average is calculated from the current period + the previous period.
 */
export function calculateDailyAverage(
  periodName: PeriodNameWithTotal,
  currentDate: Date,
  expenses: ExpenseData[],
  tripMeta: TripBudgetMeta,
  hideSpecial: boolean = false
): number {
  const today = currentDate;
  const eligible = (Array.isArray(expenses) ? expenses : []).filter((exp) =>
    isEligibleExpense(exp, { hideSpecial, maxDate: today })
  );

  switch (periodName) {
    case "total": {
      const startDate = new Date(tripMeta.startDate);
      const daysFromStartToToday = Math.max(
        1,
        Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      const totalSum = getExpensesSumPeriod(eligible, hideSpecial);
      return totalSum / daysFromStartToToday;
    }

    case "day": {
      // Average of all days from this week + last week (14 days)
      const allDays: Date[] = [];
      for (let i = 0; i < 14; i++) {
        allDays.push(getDateMinusDays(today, i) as Date);
      }

      let totalSum = 0;
      let daysWithExpenses = 0;

      allDays.forEach((day) => {
        const dayExpenses = eligible.filter((exp) =>
          isSameDay(toJsDate(exp.date), day)
        );
        const daySum = getExpensesSumPeriod(dayExpenses, hideSpecial);
        if (daySum > 0) {
          totalSum += daySum;
          daysWithExpenses++;
        }
      });

      return daysWithExpenses > 0 ? totalSum / daysWithExpenses : 0;
    }

    case "week": {
      // Average of all weeks from this month + last month
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
      const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);

      const weeks: Array<{ firstDay: Date; lastDay: Date }> = [];

      let weekStart = getPreviousMondayDate(firstDayLastMonth) as Date;
      while (weekStart < firstDayCurrentMonth) {
        const weekEnd = getDatePlusDays(weekStart, 6) as Date;
        if (weekEnd >= firstDayLastMonth) {
          weeks.push({ firstDay: weekStart, lastDay: weekEnd });
        }
        weekStart = getDatePlusDays(weekStart, 7) as Date;
      }

      weekStart = getPreviousMondayDate(firstDayCurrentMonth) as Date;
      const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
      while (weekStart <= lastDayCurrentMonth) {
        const weekEnd = getDatePlusDays(weekStart, 6) as Date;
        if (weekStart <= today) {
          weeks.push({ firstDay: weekStart, lastDay: weekEnd });
        }
        weekStart = getDatePlusDays(weekStart, 7) as Date;
      }

      let totalSum = 0;
      let weeksWithExpenses = 0;

      weeks.forEach((week) => {
        const weekStartDay = startOfDay(week.firstDay).getTime();
        const weekEndDay = startOfDay(week.lastDay).getTime();
        const weekExpenses = eligible.filter((exp) => {
          const d = startOfDay(toJsDate(exp.date)).getTime();
          if (d < weekStartDay || d > weekEndDay) return false;
          return true;
        });
        const weekSum = getExpensesSumPeriod(weekExpenses, hideSpecial);
        if (weekSum > 0) {
          totalSum += weekSum / 7;
          weeksWithExpenses++;
        }
      });

      return weeksWithExpenses > 0 ? totalSum / weeksWithExpenses : 0;
    }

    case "month": {
      // Average of all months from this year + last year
      const currentYear = today.getFullYear();
      const months: Array<{ firstDay: Date; lastDay: Date }> = [];

      for (let month = 0; month < 12; month++) {
        months.push({
          firstDay: new Date(currentYear - 1, month, 1),
          lastDay: new Date(currentYear - 1, month + 1, 0),
        });
      }

      const currentMonth = today.getMonth();
      for (let month = 0; month <= currentMonth; month++) {
        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        if (lastDay <= today) months.push({ firstDay, lastDay });
      }

      let totalSum = 0;
      let monthsWithExpenses = 0;

      months.forEach((month) => {
        const start = startOfDay(month.firstDay).getTime();
        const end = startOfDay(month.lastDay).getTime();
        const monthExpenses = eligible.filter((exp) => {
          const d = startOfDay(toJsDate(exp.date)).getTime();
          if (d < start || d > end) return false;
          return true;
        });
        const monthSum = getExpensesSumPeriod(monthExpenses, hideSpecial);
        if (monthSum > 0) {
          totalSum += monthSum / 30;
          monthsWithExpenses++;
        }
      });

      return monthsWithExpenses > 0 ? totalSum / monthsWithExpenses : 0;
    }

    case "year": {
      const currentYear = today.getFullYear();
      const startDate = new Date(tripMeta.startDate);
      const startYear = startDate.getFullYear();
      const years: Array<{ firstDay: Date; lastDay: Date }> = [];

      for (let year = startYear; year <= currentYear; year++) {
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        if (lastDay <= today) years.push({ firstDay, lastDay });
      }

      let totalSum = 0;
      let yearsWithExpenses = 0;

      years.forEach((year) => {
        const start = startOfDay(year.firstDay).getTime();
        const end = startOfDay(year.lastDay).getTime();
        const yearExpenses = eligible.filter((exp) => {
          const d = startOfDay(toJsDate(exp.date)).getTime();
          if (d < start || d > end) return false;
          return true;
        });
        const yearSum = getExpensesSumPeriod(yearExpenses, hideSpecial);
        if (yearSum > 0) {
          totalSum += yearSum / 365;
          yearsWithExpenses++;
        }
      });

      return yearsWithExpenses > 0 ? totalSum / yearsWithExpenses : 0;
    }

    default:
      return 0;
  }
}

/**
 * Calculates the daily average spending up to a specific date for chart purposes.
 * This calculates average only up to that point (no future data).
 */
export function calculateAverageUpToDate(
  periodName: PeriodName,
  targetDate: Date,
  expenses: ExpenseData[],
  tripMeta: TripBudgetMeta,
  hideSpecial: boolean = false
): number {
  // Some date helpers (e.g. getPreviousMondayDate) mutate the Date passed in.
  // Avoid mutating caller-owned Date instances.
  const safeTargetDate = new Date(targetDate);
  const eligible = (Array.isArray(expenses) ? expenses : []).filter((exp) =>
    isEligibleExpense(exp, { hideSpecial, maxDate: safeTargetDate })
  );
  switch (periodName) {
    case "day": {
      const thisWeekMonday = getPreviousMondayDate(new Date(safeTargetDate)) as Date;
      const lastWeekMonday = getDateMinusDays(thisWeekMonday, 7) as Date;

      const allDays: Date[] = [];
      for (let i = 0; i < 14; i++) {
        const day = getDateMinusDays(safeTargetDate, i) as Date;
        if (day >= lastWeekMonday && day <= safeTargetDate) allDays.push(day);
      }

      let totalSum = 0;
      let daysWithExpenses = 0;

      allDays.forEach((day) => {
        const dayExpenses = eligible.filter((exp) =>
          isSameDay(toJsDate(exp.date), day)
        );
        const daySum = getExpensesSumPeriod(dayExpenses, hideSpecial);
        if (daySum > 0) {
          totalSum += daySum;
          daysWithExpenses++;
        }
      });

      return daysWithExpenses > 0 ? totalSum / daysWithExpenses : 0;
    }

    case "week": {
      const currentMonth = safeTargetDate.getMonth();
      const currentYear = safeTargetDate.getFullYear();
      const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
      const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);

      const weeks: Array<{ firstDay: Date; lastDay: Date }> = [];

      let weekStart = getPreviousMondayDate(firstDayLastMonth) as Date;
      while (weekStart < firstDayCurrentMonth) {
        const weekEnd = getDatePlusDays(weekStart, 6) as Date;
        if (weekEnd >= firstDayLastMonth && weekEnd <= safeTargetDate) {
          weeks.push({ firstDay: weekStart, lastDay: weekEnd });
        }
        weekStart = getDatePlusDays(weekStart, 7) as Date;
      }

      weekStart = getPreviousMondayDate(firstDayCurrentMonth) as Date;
      const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
      while (weekStart <= lastDayCurrentMonth && weekStart <= safeTargetDate) {
        const weekEnd = getDatePlusDays(weekStart, 6) as Date;
        if (weekEnd <= safeTargetDate)
          weeks.push({ firstDay: weekStart, lastDay: weekEnd });
        weekStart = getDatePlusDays(weekStart, 7) as Date;
      }

      let totalSum = 0;
      let weeksWithExpenses = 0;

      weeks.forEach((week) => {
        const weekStartDay = startOfDay(week.firstDay).getTime();
        const weekEndDay = startOfDay(week.lastDay).getTime();
        const weekExpenses = eligible.filter((exp) => {
          const d = startOfDay(toJsDate(exp.date)).getTime();
          if (d < weekStartDay || d > weekEndDay) return false;
          return true;
        });
        const weekSum = getExpensesSumPeriod(weekExpenses, hideSpecial);
        if (weekSum > 0) {
          totalSum += weekSum / 7;
          weeksWithExpenses++;
        }
      });

      return weeksWithExpenses > 0 ? totalSum / weeksWithExpenses : 0;
    }

    case "month": {
      const currentYear = safeTargetDate.getFullYear();
      const months: Array<{ firstDay: Date; lastDay: Date }> = [];

      for (let month = 0; month < 12; month++) {
        const firstDay = new Date(currentYear - 1, month, 1);
        const lastDay = new Date(currentYear - 1, month + 1, 0);
        if (lastDay <= safeTargetDate) months.push({ firstDay, lastDay });
      }

      const currentMonth = safeTargetDate.getMonth();
      for (let month = 0; month <= currentMonth; month++) {
        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        if (lastDay <= safeTargetDate) months.push({ firstDay, lastDay });
      }

      let totalSum = 0;
      let monthsWithExpenses = 0;

      months.forEach((month) => {
        const start = startOfDay(month.firstDay).getTime();
        const end = startOfDay(month.lastDay).getTime();
        const monthExpenses = eligible.filter((exp) => {
          const d = startOfDay(toJsDate(exp.date)).getTime();
          if (d < start || d > end) return false;
          return true;
        });
        const monthSum = getExpensesSumPeriod(monthExpenses, hideSpecial);
        if (monthSum > 0) {
          totalSum += monthSum / 30;
          monthsWithExpenses++;
        }
      });

      return monthsWithExpenses > 0 ? totalSum / monthsWithExpenses : 0;
    }

    case "year": {
      const currentYear = safeTargetDate.getFullYear();
      const startDate = new Date(tripMeta.startDate);
      const startYear = startDate.getFullYear();
      const years: Array<{ firstDay: Date; lastDay: Date }> = [];

      for (let year = startYear; year <= currentYear; year++) {
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        if (lastDay <= safeTargetDate) years.push({ firstDay, lastDay });
      }

      let totalSum = 0;
      let yearsWithExpenses = 0;

      years.forEach((year) => {
        const start = startOfDay(year.firstDay).getTime();
        const end = startOfDay(year.lastDay).getTime();
        const yearExpenses = eligible.filter((exp) => {
          const d = startOfDay(toJsDate(exp.date)).getTime();
          if (d < start || d > end) return false;
          return true;
        });
        const yearSum = getExpensesSumPeriod(yearExpenses, hideSpecial);
        if (yearSum > 0) {
          totalSum += yearSum / 365;
          yearsWithExpenses++;
        }
      });

      return yearsWithExpenses > 0 ? totalSum / yearsWithExpenses : 0;
    }

    default:
      return 0;
  }
}

