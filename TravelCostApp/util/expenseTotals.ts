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
 * Trip total spent — deduplicates ranged expenses by rangeId, excludes deleted.
 *
 * ⚠ Known limitation: only correct for ranged-duplicate expenses (duplOrSplit=1),
 * where each day-instance stores the full calcAmount. For ranged-split expenses
 * (duplOrSplit=2) each instance stores calcAmount/days, so dedup returns just one
 * day's share — not the full cost. Pre-existing behaviour inherited from
 * getExpensesSumTotal. Use sumByPeriod over the full unfiltered list as a
 * workaround for ranged-split trip totals.
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
 * Period spend — sums every day-instance of a ranged expense (no dedup).
 *
 * The CALLER must pre-filter the list to the window first.
 * For ranged-split expenses each instance stores calcAmount/days, so summing
 * only the window's instances gives the correct proportional period cost.
 * Deduplicating here would discard all-but-one day, making the total N× too small.
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
 * Per-traveller attribution — same dedup contract as sumForTrip / sumByPeriod.
 *
 * isTotal=false (default): no dedup — caller pre-filters to window (period view).
 * isTotal=true: deduplicates by rangeId — carries the same ranged-split caveat
 *   as sumForTrip (returns one day's share, not the full cost, for duplOrSplit=2).
 *
 * Applies expense-currency → trip-currency conversion ratio for split expenses.
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
