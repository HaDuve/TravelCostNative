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
 * Trip total spent — counts each ranged expense ONCE (deduped by rangeId).
 *
 * Use for: trip-wide cumulative totals, dynamic daily budget recalculation.
 * Pass the full, unfiltered expense list; dedup and deleted exclusion happen here.
 *
 * Do NOT use for period views — sumByPeriod counts every day-instance intentionally.
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
 * Period spend — counts every day-instance of a ranged expense (no dedup).
 *
 * Use for: daily / weekly / monthly / yearly period views.
 * The CALLER must pre-filter the list to the window first. Each instance already
 * carries only its proportional calcAmount (ranged split), so summing all of them
 * gives the correct period total. Deduplicating here would silently discard
 * all-but-one day, making the period total up to N× too small.
 *
 * Do NOT use for trip-wide totals — use sumForTrip instead.
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
 * Per-traveller attribution — sums what a traveller spent across the supplied expenses.
 *
 * isTotal=false (default): counts every day-instance — use for period views where
 *   the caller has pre-filtered the list to the window (same contract as sumByPeriod).
 * isTotal=true: deduplicates ranged expenses by rangeId — use for trip total views
 *   (same contract as sumForTrip).
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
