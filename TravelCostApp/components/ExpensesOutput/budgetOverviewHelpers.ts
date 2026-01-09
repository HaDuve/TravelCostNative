import { MAX_JS_NUMBER } from "../../confAppConstants";
import {
  ExpenseData,
  getExpensesSumPeriod,
  getTravellerSum,
} from "../../util/expense";
import { ExpenseContextType, RangeString } from "../../store/expenses-context";
import { TripContextType } from "../../store/trip-context";
import { Settings } from "../../store/settings-context";
import {
  calculateDailyAverage,
  getBudgetColor,
} from "../../util/budgetColorHelper";
import { i18n } from "../../i18n/i18n";
import { GlobalStyles } from "../../constants/styles";

export interface BudgetOverviewCalculationResult {
  expensesSum: number;
  expenseSumNum: number;
  periodExpenses: ExpenseData[];
  periodLabel: string;
  budgetNumber: number;
  totalBudget: number;
  noTotalBudget: boolean;
  travellerSplitExpenseSums: number[];
  averageDailySpending: number;
  budgetColor: string;
  travellerNames: string[];
  tripCurrency: string;
  budgetMult: number;
}

export interface BudgetOverviewCalculationParams {
  expenses: ExpenseData[];
  periodName: string;
  expCtx: ExpenseContextType;
  tripCtx: TripContextType;
  settings: Settings;
  hideSpecial: boolean;
}

/**
 * Calculate all budget overview related values from expenses and context
 */
export function calculateBudgetOverview(
  params: BudgetOverviewCalculationParams
): BudgetOverviewCalculationResult {
  const { expenses, periodName, expCtx, tripCtx, settings, hideSpecial } =
    params;

  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const travellers = Array.isArray(tripCtx.travellers)
    ? tripCtx.travellers
    : [];
  const travellerNames = travellers.map((traveller) =>
    typeof traveller === "string" ? traveller : traveller?.userName
  );

  const expensesSum = getExpensesSumPeriod(safeExpenses, hideSpecial);
  const expenseSumNum = Number(expensesSum);

  let budgetNumber = Number(tripCtx.dailyBudget ?? 0);
  let periodExpenses: ExpenseData[] = [];
  let periodLabel = "";
  let totalBudget = Number(tripCtx.totalBudget ?? 0);
  if (Number.isNaN(totalBudget)) totalBudget = 0;
  if (Number.isNaN(budgetNumber)) budgetNumber = 0;

  let budgetMult = 1;
  switch (periodName) {
    case "day":
      periodExpenses = expCtx.getRecentExpenses(RangeString.day) || [];
      periodLabel = i18n.t("todayLabel");
      break;
    case "week":
      budgetMult = 7;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.week) || [];
      periodLabel = i18n.t("weekLabel");
      break;
    case "month":
      budgetMult = 30;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.month) || [];
      periodLabel = i18n.t("monthLabel");
      break;
    case "year":
      budgetMult = 365;
      budgetNumber = budgetNumber * budgetMult;
      periodExpenses = expCtx.getRecentExpenses(RangeString.year) || [];
      periodLabel = i18n.t("yearLabel");
      break;
    case "total":
      budgetNumber = totalBudget ?? MAX_JS_NUMBER;
      periodExpenses = expCtx.expenses || [];
      periodLabel = i18n.t("totalLabel");
      break;
    default:
      // For custom periods (e.g., filtered by date/category), use provided expenses
      periodExpenses = safeExpenses;
      periodLabel = periodName;
      break;
  }

  // If expenses were provided directly (e.g., from chart click), use those instead
  if (
    safeExpenses.length > 0 &&
    periodName !== "day" &&
    periodName !== "week" &&
    periodName !== "month" &&
    periodName !== "year" &&
    periodName !== "total"
  ) {
    periodExpenses = safeExpenses;
  }

  const travellerSplitExpenseSums = travellerNames.map((travellerName) => {
    return getTravellerSum(
      periodExpenses,
      travellerName || "",
      periodName === "total"
    );
  });

  if (budgetNumber > (totalBudget ?? MAX_JS_NUMBER)) budgetNumber = totalBudget;
  const noTotalBudget =
    !tripCtx.totalBudget ||
    tripCtx.totalBudget == "0" ||
    tripCtx.totalBudget == "" ||
    isNaN(Number(tripCtx.totalBudget)) ||
    tripCtx.totalBudget >= MAX_JS_NUMBER.toString();

  const today = new Date();
  const averageDailySpending = settings.trafficLightBudgetColors
    ? calculateDailyAverage(
        periodName as "day" | "week" | "month" | "year" | "total",
        today,
        expCtx,
        tripCtx,
        hideSpecial
      )
    : 0;

  const dailyBudget = Number(tripCtx.dailyBudget) || 0;
  const budgetColor = noTotalBudget
    ? GlobalStyles.colors.primary500
    : getBudgetColor(
        expenseSumNum,
        budgetNumber,
        averageDailySpending,
        dailyBudget,
        settings.trafficLightBudgetColors
      ) || GlobalStyles.colors.primary500;

  const tripCurrency = tripCtx.tripCurrency || "";

  return {
    expensesSum,
    expenseSumNum,
    periodExpenses,
    periodLabel,
    budgetNumber,
    totalBudget,
    noTotalBudget,
    travellerSplitExpenseSums,
    averageDailySpending,
    budgetColor,
    travellerNames,
    tripCurrency,
    budgetMult,
  };
}
