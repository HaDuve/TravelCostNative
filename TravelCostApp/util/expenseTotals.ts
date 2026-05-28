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
    const value = Number(e.calcAmount);
    if (!Number.isFinite(value)) return sum;
    return sum + value;
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
    const value = Number(e.calcAmount);
    if (!Number.isFinite(value) || (hideSpecial && e.isSpecialExpense))
      return sum;
    return sum + value;
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
      if (expense.calcAmount == null) return sum + Number(expense.amount);
      const value = Number(expense.calcAmount);
      if (!Number.isFinite(value)) return sum;
      return sum + value;
    }

    const split = expense.splitList!.find((s) => s.userName === travellerId);
    if (!split) return sum;

    const splitAmount =
      typeof split.amount === "string"
        ? Number(String(split.amount).replace(/^0+/, ""))
        : Number(split.amount);

    if (!Number.isFinite(splitAmount)) return sum;

    if (expense.calcAmount == null || expense.amount == null)
      return sum + splitAmount;

    const amountValue = Number(expense.amount);
    const calcValue = Number(expense.calcAmount);

    if (!Number.isFinite(amountValue) || !Number.isFinite(calcValue)) return sum;
    if (amountValue === 0) return sum + splitAmount;
    if (calcValue === amountValue) return sum + splitAmount;

    const convertedAmount = calcValue * (splitAmount / amountValue);
    if (!Number.isFinite(convertedAmount))
      return sum + splitAmount;

    return sum + convertedAmount;
  }, 0);
}
