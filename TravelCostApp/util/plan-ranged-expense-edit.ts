import { daysBetween, getDatePlusDays } from "./date";
import type { ExpenseData } from "./expense";
import { expandRangedExpense } from "./expand-ranged-expense";
import { isSameDay } from "./dateTime";

export type RangedExpenseInstanceUpdate = {
  id: string;
  expenseData: ExpenseData;
};

/** Inclusive per-day dates for a **Ranged expense** span (matches create/edit paths). */
export function buildRangedExpenseDatesFromSpan(
  startDate: Date,
  endDate: Date
): Date[] {
  const day1 = new Date(startDate);
  const day2 = new Date(endDate);
  const days = daysBetween(day2, day1);
  const dates: Date[] = [];

  for (let i = 0; i <= days; i++) {
    const newDate = getDatePlusDays(day1, i) as Date;
    newDate.setHours(new Date().getHours(), new Date().getMinutes());
    dates.push(newDate);
  }

  return dates;
}

function sortInstancesByDate(instances: ExpenseData[]): ExpenseData[] {
  return [...instances].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/** Whether the submitted span differs from the stored per-day instances. */
export function haveRangedExpenseSpanChanged(
  existingInstances: ExpenseData[],
  submitted: ExpenseData
): boolean {
  const sorted = sortInstancesByDate(existingInstances);
  const oldStart = new Date(sorted[0].date);
  const oldEnd = new Date(sorted[sorted.length - 1].date);
  const newStart = new Date(submitted.startDate);
  const newEnd = new Date(submitted.endDate);

  return !isSameDay(oldStart, newStart) || !isSameDay(oldEnd, newEnd);
}

/** Pairwise in-place updates for an unchanged **Ranged expense** span. */
export function planRangedExpenseInPlaceUpdates(
  submitted: ExpenseData,
  existingInstances: ExpenseData[]
): RangedExpenseInstanceUpdate[] {
  const sorted = sortInstancesByDate(existingInstances);
  const dates = buildRangedExpenseDatesFromSpan(
    submitted.startDate,
    submitted.endDate
  );
  const rangeId = sorted[0]?.rangeId ?? null;
  const expanded = expandRangedExpense(submitted, { rangeId, dates });

  return expanded.map((expenseData, index) => ({
    id: sorted[index].id,
    expenseData: {
      ...expenseData,
      editedTimestamp: Date.now(),
    },
  }));
}

/** Fresh per-day instances after a span change (caller deletes old range first). */
export function planRangedExpenseReplacement(
  submitted: ExpenseData,
  rangeId: string
): ExpenseData[] {
  const dates = buildRangedExpenseDatesFromSpan(
    submitted.startDate,
    submitted.endDate
  );

  return expandRangedExpense(submitted, { rangeId, dates });
}

/** Expands a single-day **Expense** into a new **Ranged expense** instance set. */
export function planNonRangedToRangedInstances(
  submitted: ExpenseData,
  rangeId: string
): ExpenseData[] {
  return planRangedExpenseReplacement(submitted, rangeId);
}
