import type { ExpenseData } from "./expense";

function deduplicateByRangeId(expenses: ExpenseData[]): ExpenseData[] {
  const seen = new Set<string>();
  return expenses.filter((e) => {
    if (e.rangeId) {
      if (seen.has(e.rangeId)) return false;
      seen.add(e.rangeId);
    }
    return true;
  });
}

/**
 * Trip total spent: deduplicates ranged expenses by rangeId, excludes deleted.
 * Use for trip-wide cumulative totals and dynamic daily budget recalculation.
 * Each ranged expense counted once regardless of how many days it spans.
 */
export function sumForTrip(expenses: ExpenseData[]): number {
  const active = expenses.filter((e) => !e.isDeleted);
  const deduped = deduplicateByRangeId(active);
  return deduped.reduce((sum, e) => {
    if (isNaN(Number(e.calcAmount))) return sum;
    return sum + Number(e.calcAmount);
  }, 0);
}

/**
 * Period spend: sums the supplied pre-filtered slice counting each day-instance
 * of a ranged expense individually. Use for daily/weekly/monthly period views.
 */
export function sumByPeriod(
  expenses: ExpenseData[],
  hideSpecial = false
): number {
  return expenses.reduce((sum, e) => {
    if (e.isDeleted) return sum;
    if (isNaN(Number(e.calcAmount)) || (hideSpecial && e.isSpecialExpense))
      return sum;
    return sum + Number(e.calcAmount);
  }, 0);
}

/**
 * Per-traveller attribution: sums what a traveller spent across the supplied
 * expenses. Applies currency-conversion ratio for split expenses.
 * Pass isTotal=true to deduplicate ranged expenses (trip total view).
 */
export function sumByTraveller(
  expenses: ExpenseData[],
  travellerId: string,
  isTotal = false
): number {
  const active = expenses.filter((e) => !e.isDeleted);
  const working = isTotal ? deduplicateByRangeId(active) : active;
  return working.reduce((sum, expense) => {
    const hasSplits = expense.splitList && expense.splitList.length > 0;

    if (!hasSplits) {
      if (expense.whoPaid !== travellerId) return sum;
      if (!expense.calcAmount) return sum + Number(expense.amount);
      return sum + Number(expense.calcAmount);
    }

    const split = expense.splitList!.find((s) => s.userName === travellerId);
    if (!split) return sum;

    const splitAmount =
      typeof split.amount === "string"
        ? Number(String(split.amount).replace(/^0+/, ""))
        : Number(split.amount);

    if (isNaN(splitAmount) || !isFinite(splitAmount)) return sum;

    if (!expense.calcAmount || !expense.amount) return sum + splitAmount;

    if (expense.calcAmount === expense.amount) return sum + splitAmount;

    const convertedAmount = expense.calcAmount * (splitAmount / expense.amount);
    if (isNaN(convertedAmount) || !isFinite(convertedAmount))
      return sum + splitAmount;

    return sum + convertedAmount;
  }, 0);
}
