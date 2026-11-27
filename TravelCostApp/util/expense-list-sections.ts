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
  | { kind: "dayHeader"; key: string; label: string }
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
 * Expenses from the last hour (up to now, but not exactly an hour ago) go
 * under "Just now" instead, whatever their time of day.
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

/** A group of the Expense list: its key and the caption of its header. */
type Section = { key: string; label: string };

function section(labelKey: string, locale: string): Section {
  return { key: labelKey, label: i18n.t(labelKey, { locale }) };
}

/**
 * True when the Expense has no real time of day: it sits exactly at
 * midnight, or it is one day of a **Ranged expense**.
 */
function hasNoTimeOfDay(expense: ExpenseData, time: DateTime): boolean {
  if (expense.rangeId) return true;
  return time.hour === 0 && time.minute === 0;
}

/**
 * Newest day first. Inside a day, Expenses with a real time of day come
 * first, newest first, and those without one (midnight, Ranged expense days)
 * follow: a Ranged expense day carries the time it was created at, which can
 * be later than anything else that day, or even later than now.
 */
function newestFirst(expenses: ExpenseData[]): ExpenseData[] {
  const keyed = expenses.map((expense) => {
    const time = toLocalDateTime(expense.date);
    return {
      expense,
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
  return keyed.map(({ expense }) => expense);
}

function timeOfDaySection(
  expense: ExpenseData,
  time: DateTime,
  now: DateTime,
  locale: string,
): Section {
  if (hasNoTimeOfDay(expense, time)) return section("today", locale);
  const minutesAgo = now.diff(time, "minutes").minutes;
  if (minutesAgo >= 0 && minutesAgo < JUST_NOW_MINUTES) {
    return section("expenseListJustNow", locale);
  }
  const group = TIME_OF_DAY_GROUPS.find(
    ({ fromHour }) => time.hour >= fromHour,
  );
  return section(group.labelKey, locale);
}

function monthSection(date: DateTime, now: DateTime, locale: string): Section {
  if (date.hasSame(now, "month"))
    return section("expenseListThisMonth", locale);
  return {
    key: date.toFormat("yyyy-MM"),
    // toLocaleString, not toFormat("LLLL"): see dayLabel (Hermes prints "null").
    label: `${date.setLocale(locale).toLocaleString({ month: "long" })} ${date.year}`,
  };
}

function sectionFor(
  expense: ExpenseData,
  period: string,
  now: DateTime,
  locale: string,
): Section {
  const date = toLocalDateTime(expense.date);
  if (PERIODS_WITH_MONTH_HEADERS.has(period))
    return monthSection(date, now, locale);
  const daySection = {
    key: date.toISODate(),
    label: dayLabel(date, now, locale),
  };
  if (period === RangeString.day) {
    // a filtered list can hold other days; only today is split by time
    if (!date.hasSame(now, "day")) return daySection;
    return timeOfDaySection(expense, date, now, locale);
  }
  return daySection;
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
    return expenses.map((expense) => ({
      kind: "expense",
      key: expense.id,
      expense,
      underDayHeader: false,
    }));
  }

  const nowDay = DateTime.fromJSDate(now);
  const groups = new Map<string, { section: Section; rows: ExpenseData[] }>();
  for (const expense of expenses) {
    const expenseSection = sectionFor(expense, period, nowDay, locale);
    const group = groups.get(expenseSection.key);
    if (group) group.rows.push(expense);
    else
      groups.set(expenseSection.key, {
        section: expenseSection,
        rows: [expense],
      });
  }

  // Groups come in the order of their first Expense. The newest-first sort
  // already puts today's "Today" group (no time of day) after its
  // time-of-day groups.
  const entries: ExpenseListEntry[] = [];
  for (const { section: groupSection, rows } of groups.values()) {
    entries.push({
      kind: "dayHeader",
      key: `dayHeader-${groupSection.key}`,
      label: groupSection.label,
    });
    for (const expense of rows) {
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
  dayHeaderHeight: number;
};

/**
 * Height and scroll offset of every row, for FlatList's `getItemLayout`.
 * Day headers are shorter than Expense rows, so offsets are summed rather
 * than assumed to be `index * rowHeight`.
 */
export function expenseListItemLayouts(
  entries: ExpenseListEntry[],
  { expenseRowHeight, dayHeaderHeight }: ExpenseListRowHeights,
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
