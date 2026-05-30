import { createSafeDate, DateOrDateTime } from "./date";
import { ExpenseData } from "./expense";

export type ExpenseNavigationDto = Omit<
  ExpenseData,
  "date" | "startDate" | "endDate"
> & {
  date: string;
  startDate: string;
  endDate: string;
};

export type FilteredExpensesParams = {
  expenses: ExpenseNavigationDto[];
  dayString: string;
  showSumForTravellerName?: string;
};

export type FilteredPieChartsParams = {
  expenses: ExpenseNavigationDto[];
  dayString: string;
  noList?: boolean;
};

function toIsoString(dateValue: DateOrDateTime | string): string {
  if (typeof dateValue === "string") {
    return dateValue;
  }
  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }
  return dateValue.toJSDate().toISOString();
}

export function expenseDateToIsoString(
  dateValue: DateOrDateTime | string
): string {
  return toIsoString(dateValue);
}

export function toExpenseNavigationDto(
  expense: ExpenseData
): ExpenseNavigationDto {
  const { date, startDate, endDate, ...rest } = expense;
  return {
    ...rest,
    date: toIsoString(date),
    startDate: toIsoString(startDate),
    endDate: toIsoString(endDate),
  };
}

export function toExpenseNavigationDtos(
  expenses: ExpenseData[]
): ExpenseNavigationDto[] {
  return expenses.map(toExpenseNavigationDto);
}

export function hydrateExpenseFromNavigationDto(
  dto: ExpenseNavigationDto
): ExpenseData {
  const { date, startDate, endDate, ...rest } = dto;
  return {
    ...rest,
    date: createSafeDate(date),
    startDate: createSafeDate(startDate),
    endDate: createSafeDate(endDate),
  };
}

export function hydrateExpensesFromNavigationDtos(
  dtos: ExpenseNavigationDto[]
): ExpenseData[] {
  return dtos.map(hydrateExpenseFromNavigationDto);
}
