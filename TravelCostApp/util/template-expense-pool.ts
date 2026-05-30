import type { ExpenseData } from "./expense";

/** When a trip has more than this many expenses, template selection uses a capped pool. */
export const LARGE_TRIP_TEMPLATE_EXPENSE_THRESHOLD = 250;

/** Newest expenses (by `editedTimestamp`) used as the template source on large trips. */
export const LARGE_TRIP_TEMPLATE_POOL_SIZE = 250;

export function expensesForTemplateSelection(
  expenses: ExpenseData[]
): ExpenseData[] {
  if (expenses.length <= LARGE_TRIP_TEMPLATE_EXPENSE_THRESHOLD) {
    return expenses;
  }
  return [...expenses]
    .sort(
      (a, b) => (b.editedTimestamp ?? 0) - (a.editedTimestamp ?? 0)
    )
    .slice(0, LARGE_TRIP_TEMPLATE_POOL_SIZE);
}
