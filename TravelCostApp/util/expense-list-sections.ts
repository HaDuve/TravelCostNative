import { DateTime } from "luxon";
import { i18n } from "../i18n/i18n";
import { RangeString } from "../store/expenses-context";
import type { DateOrDateTime } from "./date";
import type { ExpenseData } from "./expense";

/**
 * One row of the Expense list: either a header (a caption above a group of
 * Expenses: a day, a time of day or a month, depending on the period) or an
 * Expense.
 *
 * `underDayHeader` tells the row its date is already shown by the header above
 * it, so the row only needs to show the time.
 */
export type ExpenseListEntry =
  | {
      kind: "header";
      key: string;
      label: string;
      /**
       * Period spend of the group, in the Trip currency (see CONTEXT.md).
       * Left out in the day period, whose headers stay unchanged.
       */
      total?: number;
    }
  | {
      kind: "expense";
      key: string;
      expense: ExpenseData;
      underDayHeader: boolean;
    };

/** Periods whose Expense list is split into groups by day or time of day. */
const PERIODS_WITH_DAY_HEADERS: ReadonlySet<string> = new Set([
  RangeString.day,
  RangeString.week,
  RangeString.month,
]);

/** Periods whose Expense list is split into groups by month. */
const PERIODS_WITH_MONTH_HEADERS: ReadonlySet<string> = new Set([
  RangeString.year,
  RangeString.total,
]);

function toLocalDateTime(date: DateOrDateTime | string): DateTime {
  if (date instanceof DateTime) return date;
  return DateTime.fromJSDate(new Date(date));
}

/**
 * Time of day of an Expense, e.g. "14:32" (shown under a day header). Empty
 * for a Ranged expense day: it only carries the time the Ranged expense was
 * created at.
 */
export function formatExpenseTimeOfDay(
  expense: Pick<ExpenseData, "date" | "rangeId">,
): string {
  if (expense.rangeId) return "";
  return toLocalDateTime(expense.date).toFormat("HH:mm");
}

function dayLabel(
  day: DateTime,
  now: DateTime,
  locale: string,
  relative: boolean,
): string {
  if (relative && day.hasSame(now, "day")) return i18n.t("today", { locale });
  if (relative && day.hasSame(now.minus({ days: 1 }), "day"))
    return i18n.t("yesterday", { locale });
  // toLocaleString, not toFormat("cccc"): luxon's weekday token needs
  // Intl formatToParts, which prints "null" on Hermes.
  const weekday = day.setLocale(locale).toLocaleString({ weekday: "long" });
  return `${weekday} ${day.toFormat("dd.MM")}`;
}

/**
 * Time-of-day groups of the day period, latest first. `fromHour` is the
 * first hour of the group (inclusive); a group ends where the previous one
 * in this list starts.
 *
 *   This evening     18:00 - 23:59
 *   This afternoon   14:00 - 17:59
 *   Midday           11:00 - 13:59
 *   This morning     05:00 - 10:59
 *   Last night       00:01 - 04:59
 *
 * Expenses from the last hour (not exactly an hour ago), and those dated
 * later today than now, go under "Just now" instead, whatever their time of
 * day.
 */
const TIME_OF_DAY_GROUPS: ReadonlyArray<{
  fromHour: number;
  labelKey: string;
}> = [
  { fromHour: 18, labelKey: "expenseListThisEvening" },
  { fromHour: 14, labelKey: "expenseListThisAfternoon" },
  { fromHour: 11, labelKey: "expenseListMidday" },
  { fromHour: 5, labelKey: "expenseListThisMorning" },
  { fromHour: 0, labelKey: "expenseListLastNight" },
];

const JUST_NOW_MINUTES = 60;

/**
 * True when the Expense has no real time of day: it sits exactly at
 * midnight, or it is one day of a **Ranged expense**.
 */
function hasNoTimeOfDay(expense: ExpenseData, time: DateTime): boolean {
  if (expense.rangeId) return true;
  return time.hour === 0 && time.minute === 0;
}

/** An Expense with its local date, computed once by `newestFirst`. */
type DatedExpense = { expense: ExpenseData; time: DateTime };

/**
 * Newest day first. Inside a day, Expenses with a real time of day come
 * first, newest first, and those without one (midnight, Ranged expense days)
 * follow: a Ranged expense day carries the time it was created at, which can
 * be later than anything else that day, or even later than now. Returns a
 * sorted copy, each Expense with its local date.
 */
function newestFirst(expenses: ExpenseData[]): DatedExpense[] {
  const keyed = expenses.map((expense) => {
    const time = toLocalDateTime(expense.date);
    return {
      expense,
      time,
      day: time.startOf("day").toMillis(),
      noTimeOfDay: hasNoTimeOfDay(expense, time),
      millis: time.toMillis(),
    };
  });
  keyed.sort(
    (a, b) =>
      b.day - a.day ||
      Number(a.noTimeOfDay) - Number(b.noTimeOfDay) ||
      b.millis - a.millis,
  );
  return keyed.map(({ expense, time }) => ({ expense, time }));
}

/** i18n key of the time-of-day group of an Expense dated today. */
function timeOfDayLabelKey(
  { expense, time }: DatedExpense,
  now: DateTime,
): string {
  if (hasNoTimeOfDay(expense, time)) return "today";
  const minutesAgo = now.diff(time, "minutes").minutes;
  // negative when dated later than now: still "Just now", so it does not
  // land in a group above it
  if (minutesAgo < JUST_NOW_MINUTES) return "expenseListJustNow";
  return TIME_OF_DAY_GROUPS.find(({ fromHour }) => time.hour >= fromHour)
    .labelKey;
}

/**
 * Key of the group an Expense belongs to. Cheap, since it runs for every
 * Expense; the caption is built once per group by `groupLabel`.
 */
function groupKey(row: DatedExpense, period: string, now: DateTime): string {
  const { time } = row;
  if (PERIODS_WITH_MONTH_HEADERS.has(period)) {
    return time.toFormat("yyyy-MM");
  }
  // a filtered list can hold other days; only today is split by time
  if (period === RangeString.day && time.hasSame(now, "day")) {
    return timeOfDayLabelKey(row, now);
  }
  return time.toISODate();
}

/** Period spend of a group: Ranged expense days count once per day. */
function periodSpend(rows: DatedExpense[]): number {
  let sum = 0;
  for (const { expense } of rows) {
    const amount = Number(expense.calcAmount);
    if (!isNaN(amount)) sum += amount;
  }
  return sum;
}

/** Caption of a group, from its key and the date of its first Expense. */
function groupLabel(
  key: string,
  first: DateTime,
  period: string,
  now: DateTime,
  locale: string,
): string {
  if (PERIODS_WITH_MONTH_HEADERS.has(period)) {
    // toLocaleString, not toFormat("LLLL"): see dayLabel (Hermes prints "null").
    return `${first.setLocale(locale).toLocaleString({ month: "long" })} ${first.year}`;
  }
  if (period === RangeString.day && first.hasSame(now, "day")) {
    return i18n.t(key, { locale });
  }
  // only the day period keeps "Today" / "Yesterday"
  return dayLabel(first, now, locale, period === RangeString.day);
}

/**
 * Turns the Expenses shown for a period into the rows of the Expense list.
 *
 * - day: today's Expenses in time-of-day groups (see `TIME_OF_DAY_GROUPS`),
 *   with those that have no real time of day under a "Today" group at the
 *   end. Expenses from other days (filtered lists) get a day group as in
 *   the week period.
 * - week and month: one group per local day ("Today", "Yesterday",
 *   "Monday 23.11").
 * - year and total: one group per month ("This month", "October 2026"),
 *   with the month name from the locale.
 *
 * Under day and time-of-day headers a row only needs its time
 * (`underDayHeader`); under month headers it keeps its short date.
 *
 * The Expenses are sorted newest first (see `newestFirst`) whatever order
 * they come in, since the store does not keep its list sorted after an add
 * or an edit; groups follow from that order. An unknown period gets plain
 * Expense rows.
 */
export function groupExpensesForList(
  unsortedExpenses: ExpenseData[],
  period: RangeString | string,
  now: Date,
  locale: string,
): ExpenseListEntry[] {
  const expenses = newestFirst(unsortedExpenses);
  const underDayHeader = PERIODS_WITH_DAY_HEADERS.has(period);
  if (!underDayHeader && !PERIODS_WITH_MONTH_HEADERS.has(period)) {
    return expenses.map(({ expense }) => ({
      kind: "expense",
      key: expense.id,
      expense,
      underDayHeader: false,
    }));
  }

  const nowDay = DateTime.fromJSDate(now);
  const groups = new Map<string, DatedExpense[]>();
  for (const row of expenses) {
    const key = groupKey(row, period, nowDay);
    const rows = groups.get(key);
    if (rows) rows.push(row);
    else groups.set(key, [row]);
  }

  // Groups come in the order of their first Expense. The newest-first sort
  // already puts today's "Today" group (no time of day) after its
  // time-of-day groups.
  const entries: ExpenseListEntry[] = [];
  for (const [key, rows] of groups) {
    entries.push({
      kind: "header",
      key: `header-${key}`,
      label: groupLabel(key, rows[0].time, period, nowDay, locale),
      ...(period === RangeString.day ? {} : { total: periodSpend(rows) }),
    });
    for (const { expense } of rows) {
      entries.push({
        kind: "expense",
        key: expense.id,
        expense,
        underDayHeader,
      });
    }
  }
  return entries;
}

export type ExpenseListRowHeights = {
  expenseRowHeight: number;
  headerHeight: number;
};

/**
 * Height and scroll offset of every row, for FlatList's `getItemLayout`.
 * Section headers are shorter than Expense rows, so offsets are summed rather
 * than assumed to be `index * rowHeight`.
 */
export function expenseListItemLayouts(
  entries: ExpenseListEntry[],
  { expenseRowHeight, headerHeight }: ExpenseListRowHeights,
): { length: number; offset: number }[] {
  let offset = 0;
  return entries.map((entry) => {
    const length =
      entry.kind === "header" ? headerHeight : expenseRowHeight;
    const layout = { length, offset };
    offset += length;
    return layout;
  });
}
