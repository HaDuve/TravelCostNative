import { DuplicateOption, type ExpenseData } from "./expense";

declare const __periodBrand: unique symbol;
export type PeriodSlice = ExpenseData[] & { readonly [__periodBrand]: void };
export function asPeriodSlice(expenses: ExpenseData[]): PeriodSlice {
  return expenses as PeriodSlice;
}

function consolidateRangedExpenses(expenses: ExpenseData[]): ExpenseData[] {
  const byRangeId = new Map<string, ExpenseData[]>();
  const out: ExpenseData[] = [];

  for (const e of expenses) {
    if (!e.rangeId) {
      out.push(e);
      continue;
    }
    const existing = byRangeId.get(e.rangeId);
    if (existing) {
      existing.push(e);
    } else {
      byRangeId.set(e.rangeId, [e]);
    }
  }

  for (const instances of byRangeId.values()) {
    const first = instances[0];
    if (first.duplOrSplit === DuplicateOption.split) {
      const totalCalc = instances.reduce((sum, e) => {
        const value = Number(e.calcAmount);
        if (!Number.isFinite(value)) return sum;
        return sum + value;
      }, 0);
      out.push({ ...first, calcAmount: totalCalc });
    } else {
      out.push(first);
    }
  }

  return out;
}

/**
 * Trip total spent — deduplicates ranged expenses by rangeId, excludes deleted.
 */
export function sumForTrip(expenses: ExpenseData[]): number {
  const active = expenses.filter((e) => !e.isDeleted);
  const consolidated = consolidateRangedExpenses(active);
  return consolidated.reduce((sum, e) => {
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
  expenses: PeriodSlice,
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
 * isTotal=true: deduplicates by rangeId — for ranged-split (duplOrSplit=2),
 * consolidation reconstructs full cost by summing instances in the input slice.
 *
 * Applies expense-currency → trip-currency conversion ratio for split expenses.
 */
export function sumByTraveller(
  expenses: ExpenseData[],
  travellerId: string,
  isTotal = false
): number {
  const active = expenses.filter((e) => !e.isDeleted);
  const working = isTotal ? consolidateRangedExpenses(active) : active;
  return working.reduce((sum, expense) => {
    const hasSplits = expense.splitList && expense.splitList.length > 0;

    if (!hasSplits) {
      if (expense.whoPaid !== travellerId) return sum;
      if (expense.calcAmount == null) {
        const amountValue = Number(expense.amount);
        if (!Number.isFinite(amountValue)) return sum;
        return sum + amountValue;
      }
      const value = Number(expense.calcAmount);
      if (!Number.isFinite(value)) return sum;
      return sum + value;
    }

    const split = expense.splitList?.find((s) => s.userName === travellerId);
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
