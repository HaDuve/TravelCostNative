import { ExpenseData, getExpensesSumPeriod } from "./expense";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import {
  getDateMinusDays,
  getPreviousMondayDate,
  getDatePlusDays,
} from "./date";
import { GlobalStyles } from "../constants/styles";

/**
 * Calculates the daily average spending up to a specific date for chart purposes.
 * This calculates average only up to that point (no future data).
 */
export function calculateAverageUpToDate(
  periodName: "day" | "week" | "month" | "year",
  targetDate: Date,
  expensesContext: ExpensesContext,
  tripContext: TripContext,
  hideSpecial: boolean = false
): number {
  const dailyBudget = Number(tripContext.dailyBudget) || 0;
  const today = new Date();

  switch (periodName) {
    case "day": {
      // Average of all days from this week + last week up to targetDate
      const thisWeekMonday = getPreviousMondayDate(targetDate);
      const lastWeekMonday = getDateMinusDays(thisWeekMonday, 7);

      const allDays: Date[] = [];
      for (let i = 0; i < 14; i++) {
        const day = getDateMinusDays(targetDate, i);
        if (day >= lastWeekMonday && day <= targetDate) {
          allDays.push(day);
        }
      }

      let totalSum = 0;
      let daysWithExpenses = 0;

      allDays.forEach((day) => {
        const dayExpenses = expensesContext.getDailyExpenses(
          Math.floor(
            (targetDate.getTime() - day.getTime()) / (1000 * 60 * 60 * 24)
          )
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
      // Average of all weeks from this month + last month up to targetDate
      const currentMonth = targetDate.getMonth();
      const currentYear = targetDate.getFullYear();
      const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
      const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);

      const weeks: Array<{ firstDay: Date; lastDay: Date }> = [];

      let weekStart = getPreviousMondayDate(firstDayLastMonth);
      while (weekStart < firstDayCurrentMonth) {
        const weekEnd = getDatePlusDays(weekStart, 6);
        if (weekEnd >= firstDayLastMonth && weekEnd <= targetDate) {
          weeks.push({ firstDay: weekStart, lastDay: weekEnd });
        }
        weekStart = getDatePlusDays(weekStart, 7);
      }

      weekStart = getPreviousMondayDate(firstDayCurrentMonth);
      const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
      while (weekStart <= lastDayCurrentMonth && weekStart <= targetDate) {
        const weekEnd = getDatePlusDays(weekStart, 6);
        if (weekEnd <= targetDate) {
          weeks.push({ firstDay: weekStart, lastDay: weekEnd });
        }
        weekStart = getDatePlusDays(weekStart, 7);
      }

      let totalSum = 0;
      let weeksWithExpenses = 0;

      weeks.forEach((week) => {
        const weekExpenses = expensesContext
          .getSpecificWeekExpenses(week.firstDay)
          .filter(
            (exp) =>
              (!exp.isSpecialExpense ||
                (exp.isSpecialExpense && !hideSpecial)) &&
              exp.date <= targetDate
          );
        const weekSum = getExpensesSumPeriod(weekExpenses, hideSpecial);
        if (weekSum > 0) {
          totalSum += weekSum / 7;
          weeksWithExpenses++;
        }
      });

      return weeksWithExpenses > 0 ? totalSum / weeksWithExpenses : 0;
    }

    case "month": {
      // Average of all months from this year + last year up to targetDate
      const currentYear = targetDate.getFullYear();
      const months: Array<{ firstDay: Date; lastDay: Date }> = [];

      for (let month = 0; month < 12; month++) {
        const firstDay = new Date(currentYear - 1, month, 1);
        const lastDay = new Date(currentYear - 1, month + 1, 0);
        if (lastDay <= targetDate) {
          months.push({ firstDay, lastDay });
        }
      }

      const currentMonth = targetDate.getMonth();
      for (let month = 0; month <= currentMonth; month++) {
        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        if (lastDay <= targetDate) {
          months.push({ firstDay, lastDay });
        }
      }

      let totalSum = 0;
      let monthsWithExpenses = 0;

      months.forEach((month) => {
        const monthExpenses = expensesContext
          .getSpecificMonthExpenses(month.firstDay)
          .filter(
            (exp) =>
              (!exp.isSpecialExpense ||
                (exp.isSpecialExpense && !hideSpecial)) &&
              exp.date <= targetDate
          );
        const monthSum = getExpensesSumPeriod(monthExpenses, hideSpecial);
        if (monthSum > 0) {
          totalSum += monthSum / 30;
          monthsWithExpenses++;
        }
      });

      return monthsWithExpenses > 0 ? totalSum / monthsWithExpenses : 0;
    }

    case "year": {
      // Average of all years up to targetDate
      const currentYear = targetDate.getFullYear();
      const startDate = new Date(tripContext.startDate);
      const startYear = startDate.getFullYear();
      const years: Array<{ firstDay: Date; lastDay: Date }> = [];

      for (let year = startYear; year <= currentYear; year++) {
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        if (lastDay <= targetDate) {
          years.push({ firstDay, lastDay });
        }
      }

      let totalSum = 0;
      let yearsWithExpenses = 0;

      years.forEach((year) => {
        const yearExpenses = expensesContext
          .getSpecificYearExpenses(year.firstDay)
          .filter(
            (exp) =>
              (!exp.isSpecialExpense ||
                (exp.isSpecialExpense && !hideSpecial)) &&
              exp.date <= targetDate
          );
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
 * Calculates the daily average spending for a given period.
 * The average is calculated from the current period + the previous period.
 *
 * @param periodName - The period type: "day", "week", "month", "year", or "total"
 * @param currentDate - The current date for the period being evaluated
 * @param expensesContext - The expenses context to get expense data
 * @param tripContext - The trip context to get budget and date information
 * @param hideSpecial - Whether to hide special expenses
 * @returns The daily average spending amount
 */
export function calculateDailyAverage(
  periodName: "day" | "week" | "month" | "year" | "total",
  currentDate: Date,
  expensesContext: ExpensesContext,
  tripContext: TripContext,
  hideSpecial: boolean = false
): number {
  const today = new Date();
  const dailyBudget = Number(tripContext.dailyBudget) || 0;

  switch (periodName) {
    case "day": {
      // Average of all days from this week + last week
      const thisWeekMonday = getPreviousMondayDate(today);
      const lastWeekMonday = getDateMinusDays(thisWeekMonday, 7);
      const lastWeekSunday = getDatePlusDays(lastWeekMonday, 6);

      // Get all days from this week and last week
      const allDays: Date[] = [];
      for (let i = 0; i < 14; i++) {
        const day = getDateMinusDays(today, i);
        if (day >= lastWeekMonday && day <= today) {
          allDays.push(day);
        }
      }

      let totalSum = 0;
      let daysWithExpenses = 0;

      allDays.forEach((day) => {
        const dayExpenses = expensesContext.getDailyExpenses(
          Math.floor((today.getTime() - day.getTime()) / (1000 * 60 * 60 * 24))
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
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Get first day of current month
      const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
      // Get first day of last month
      const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);

      // Calculate weeks in both months
      const weeks: Array<{ firstDay: Date; lastDay: Date }> = [];

      // Last month weeks
      let weekStart = getPreviousMondayDate(firstDayLastMonth);
      while (weekStart < firstDayCurrentMonth) {
        const weekEnd = getDatePlusDays(weekStart, 6);
        if (weekEnd >= firstDayLastMonth) {
          weeks.push({ firstDay: weekStart, lastDay: weekEnd });
        }
        weekStart = getDatePlusDays(weekStart, 7);
      }

      // Current month weeks
      weekStart = getPreviousMondayDate(firstDayCurrentMonth);
      const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
      while (weekStart <= lastDayCurrentMonth) {
        const weekEnd = getDatePlusDays(weekStart, 6);
        if (weekStart <= today) {
          weeks.push({ firstDay: weekStart, lastDay: weekEnd });
        }
        weekStart = getDatePlusDays(weekStart, 7);
      }

      let totalSum = 0;
      let weeksWithExpenses = 0;

      weeks.forEach((week) => {
        const weekExpenses = expensesContext
          .getSpecificWeekExpenses(week.firstDay)
          .filter(
            (exp) =>
              !exp.isSpecialExpense || (exp.isSpecialExpense && !hideSpecial)
          );
        const weekSum = getExpensesSumPeriod(weekExpenses, hideSpecial);
        if (weekSum > 0) {
          totalSum += weekSum / 7; // Convert to daily average for the week
          weeksWithExpenses++;
        }
      });

      return weeksWithExpenses > 0 ? totalSum / weeksWithExpenses : 0;
    }

    case "month": {
      // Average of all months from this year + last year
      const currentYear = currentDate.getFullYear();
      const months: Array<{ firstDay: Date; lastDay: Date }> = [];

      // Last year months
      for (let month = 0; month < 12; month++) {
        const firstDay = new Date(currentYear - 1, month, 1);
        const lastDay = new Date(currentYear - 1, month + 1, 0);
        months.push({ firstDay, lastDay });
      }

      // Current year months up to current month
      const currentMonth = currentDate.getMonth();
      for (let month = 0; month <= currentMonth; month++) {
        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        if (lastDay <= today) {
          months.push({ firstDay, lastDay });
        }
      }

      let totalSum = 0;
      let monthsWithExpenses = 0;

      months.forEach((month) => {
        const monthExpenses = expensesContext
          .getSpecificMonthExpenses(month.firstDay)
          .filter(
            (exp) =>
              !exp.isSpecialExpense || (exp.isSpecialExpense && !hideSpecial)
          );
        const monthSum = getExpensesSumPeriod(monthExpenses, hideSpecial);
        if (monthSum > 0) {
          totalSum += monthSum / 30; // Convert to daily average for the month
          monthsWithExpenses++;
        }
      });

      return monthsWithExpenses > 0 ? totalSum / monthsWithExpenses : 0;
    }

    case "year": {
      // For year view, calculate average of all years up to current year
      const currentYear = currentDate.getFullYear();
      const years: Array<{ firstDay: Date; lastDay: Date }> = [];

      // Get all years from start of trip to current year
      const startDate = new Date(tripContext.startDate);
      const startYear = startDate.getFullYear();

      for (let year = startYear; year <= currentYear; year++) {
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        if (lastDay <= today) {
          years.push({ firstDay, lastDay });
        }
      }

      let totalSum = 0;
      let yearsWithExpenses = 0;

      years.forEach((year) => {
        const yearExpenses = expensesContext
          .getSpecificYearExpenses(year.firstDay)
          .filter(
            (exp) =>
              !exp.isSpecialExpense || (exp.isSpecialExpense && !hideSpecial)
          );
        const yearSum = getExpensesSumPeriod(yearExpenses, hideSpecial);
        if (yearSum > 0) {
          totalSum += yearSum / 365; // Convert to daily average for the year
          yearsWithExpenses++;
        }
      });

      return yearsWithExpenses > 0 ? totalSum / yearsWithExpenses : 0;
    }

    case "total": {
      // Total: (total expenses / days from start to today)
      const startDate = new Date(tripContext.startDate);
      const daysFromStartToToday = Math.max(
        1,
        Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      const allExpenses = expensesContext.expenses.filter(
        (exp) =>
          !exp.isDeleted &&
          (!exp.isSpecialExpense || (exp.isSpecialExpense && !hideSpecial)) &&
          exp.date <= today
      );

      const totalSum = getExpensesSumPeriod(allExpenses, hideSpecial);
      return totalSum / daysFromStartToToday;
    }

    default:
      return 0;
  }
}

/**
 * Determines the budget color based on expenses and average spending.
 *
 * @param expensesSum - The sum of expenses for the current period
 * @param budget - The budget for the current period
 * @param averageDailySpending - The average daily spending (calculated from larger period)
 * @param dailyBudget - The daily budget amount
 * @param useTrafficLight - Whether to use traffic light system (red/orange/green) or simple (red/green)
 * @returns The color string to use
 */
export function getBudgetColor(
  expensesSum: number,
  budget: number,
  averageDailySpending: number,
  dailyBudget: number,
  useTrafficLight: boolean
): string {
  if (!useTrafficLight) {
    // Fall back to original red/green logic
    return expensesSum > budget
      ? GlobalStyles.colors.error300
      : GlobalStyles.colors.primary500;
  }

  // Traffic light system
  if (expensesSum <= budget) {
    // Under budget = Green
    return GlobalStyles.colors.primary500;
  } else {
    // Over budget - check average
    if (averageDailySpending > dailyBudget) {
      // Over budget AND average over budget = Red
      return GlobalStyles.colors.error300;
    } else {
      // Over budget BUT average under budget = Orange
      return GlobalStyles.colors.accent500;
    }
  }
}
