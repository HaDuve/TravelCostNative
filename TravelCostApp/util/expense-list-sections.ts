import { DateTime } from "luxon";
import { i18n } from "../i18n/i18n";
import { RangeString } from "../store/expenses-context";
import type { DateOrDateTime } from "./date";
import type { ExpenseData } from "./expense";

/**
 * One row of the Expense list: either a day header (a caption above a group
 * of Expenses) or an Expense.
 *
 * `underDayHeader` tells the row its date is already shown by the header above
 * it, so the row only needs to show the time.
 */
export type ExpenseListEntry =
  | { kind: "dayHeader"; key: string; label: string }
  | {
      kind: "expense";
      key: string;
      expense: ExpenseData;
      underDayHeader: boolean;
    };

/** Periods whose Expense list is split into day groups. */
const PERIODS_WITH_DAY_HEADERS: ReadonlySet<string> = new Set([
  RangeString.week,
]);

function toLocalDateTime(date: DateOrDateTime | string): DateTime {
  if (date instanceof DateTime) return date;
  return DateTime.fromJSDate(new Date(date));
}

/** Time of day of an Expense, e.g. "14:32" (shown under a day header). */
export function formatExpenseTimeOfDay(date: DateOrDateTime | string): string {
  return toLocalDateTime(date).toFormat("HH:mm");
}

function dayLabel(day: DateTime, now: DateTime, locale: string): string {
  if (day.hasSame(now, "day")) return i18n.t("today", { locale });
  if (day.hasSame(now.minus({ days: 1 }), "day"))
    return i18n.t("yesterday", { locale });
  // toLocaleString, not toFormat("cccc"): luxon's weekday token needs
  // Intl formatToParts, which prints "null" on Hermes.
  const weekday = day.setLocale(locale).toLocaleString({ weekday: "long" });
  return `${weekday} ${day.toFormat("dd.MM")}`;
}

/**
 * Newest local day first, then newest time first inside a day. The sort is
 * stable, so Expenses with the same time keep their incoming order. Returns a
 * sorted copy.
 */
function newestFirst(expenses: ExpenseData[]): ExpenseData[] {
  const keyed = expenses.map((expense) => {
    const time = toLocalDateTime(expense.date);
    return {
      expense,
      day: time.startOf("day").toMillis(),
      millis: time.toMillis(),
    };
  });
  keyed.sort((a, b) => b.day - a.day || b.millis - a.millis);
  return keyed.map(({ expense }) => expense);
}

/**
 * Turns the Expenses shown for a period into the rows of the Expense list.
 *
 * In the week period every local day gets a header ("Today", "Yesterday",
 * "Monday 23.11", ...) above its Expenses. Other periods get plain Expense
 * rows.
 *
 * The Expenses are sorted newest first (see `newestFirst`) whatever order
 * they come in, since the store does not keep its list sorted after an add
 * or an edit; a header starts whenever the day changes.
 */
export function groupExpensesForList(
  unsortedExpenses: ExpenseData[],
  period: RangeString | string,
  now: Date,
  locale: string
): ExpenseListEntry[] {
  const expenses = newestFirst(unsortedExpenses);
  if (!PERIODS_WITH_DAY_HEADERS.has(period)) {
    return expenses.map((expense) => ({
      kind: "expense",
      key: expense.id,
      expense,
      underDayHeader: false,
    }));
  }

  const nowDay = DateTime.fromJSDate(now);
  const entries: ExpenseListEntry[] = [];
  let currentDayKey: string | null = null;

  for (const expense of expenses) {
    const day = toLocalDateTime(expense.date);
    const dayKey = day.toISODate();
    if (dayKey !== currentDayKey) {
      currentDayKey = dayKey;
      entries.push({
        kind: "dayHeader",
        key: `dayHeader-${dayKey}`,
        label: dayLabel(day, nowDay, locale),
      });
    }
    entries.push({
      kind: "expense",
      key: expense.id,
      expense,
      underDayHeader: true,
    });
  }
  return entries;
}

export type ExpenseListRowHeights = {
  expenseRowHeight: number;
  dayHeaderHeight: number;
};

/**
 * Height and scroll offset of every row, for FlatList's `getItemLayout`.
 * Day headers are shorter than Expense rows, so offsets are summed rather
 * than assumed to be `index * rowHeight`.
 */
export function expenseListItemLayouts(
  entries: ExpenseListEntry[],
  { expenseRowHeight, dayHeaderHeight }: ExpenseListRowHeights
): { length: number; offset: number }[] {
  let offset = 0;
  return entries.map((entry) => {
    const length =
      entry.kind === "dayHeader" ? dayHeaderHeight : expenseRowHeight;
    const layout = { length, offset };
    offset += length;
    return layout;
  });
}
