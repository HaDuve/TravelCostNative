import {
  getEffectivePaidBack,
  paidBackStatus,
  type ExpenseData,
} from "./expense";
import { rollupOpenBalances } from "./split";

/**
 * Split history: one entry per change to an **Expense** that moves the Split
 * Summary (add, edit, delete, undo, **Paid back**, **Settlement**). An entry
 * stores the per-Traveller **Balance** change in **Trip currency**, never a
 * snapshot of the expense.
 */
export type SplitHistoryKind =
  | "added"
  | "edited"
  | "deleted"
  | "undone"
  | "paidBack"
  | "settlement";

export const SPLIT_HISTORY_KINDS: SplitHistoryKind[] = [
  "added",
  "edited",
  "deleted",
  "undone",
  "paidBack",
  "settlement",
];

/** Positive = the Traveller is owed more, negative = owes more. */
export type BalanceChange = { userName: string; amount: number };

export interface SplitHistoryEntry {
  /** Time-sortable id, also the RTDB key (see {@link newSplitHistoryId}). */
  id: string;
  kind: SplitHistoryKind;
  /** The **Description** of the expense; empty for a **Settlement**. */
  description: string;
  byUid: string;
  byName: string;
  timestamp: number;
  tripCurrency: string;
  balanceChanges: BalanceChange[];
  /** Set when the change touches a **Ranged expense** (one day or all of it). */
  range?: SplitHistoryRange;
  /**
   * Set on a grouped entry: one change to several days of a **Ranged expense**
   * shown as one row, expandable to these per-day lines. A change to a single
   * day has `range` but no `days`.
   */
  days?: SplitHistoryDay[];
}

/**
 * The **Ranged expense** a change belongs to. Dates are calendar days
 * (`YYYY-MM-DD`) covering the whole range, not only the days that changed.
 */
export type SplitHistoryRange = {
  rangeId: string;
  startDate: string;
  endDate: string;
};

/** One day of a grouped entry; the days add up to the entry's `balanceChanges`. */
export type SplitHistoryDay = { date: string; balanceChanges: BalanceChange[] };

export type SplitHistoryAuthor = { uid: string; userName: string };

const SORTABLE_TS_WIDTH = 13;

/**
 * Lexicographically sortable by time (RTDB orders keys as strings), with a
 * random suffix so two Travellers writing in the same millisecond do not clash.
 */
export function newSplitHistoryId(now: number = Date.now()): string {
  const rnd = Math.random().toString(36).slice(2, 8).padEnd(6, "0");
  return `${String(now).padStart(SORTABLE_TS_WIDTH, "0")}-${rnd}`;
}

/** Net open position per Traveller, in integer cents (positive = is owed). */
function netCents(
  expenses: ExpenseData[],
  tripCurrency: string,
  isPaidTimestamp?: number
): Map<string, number> {
  const net = new Map<string, number>();
  const open = rollupOpenBalances(expenses, tripCurrency, isPaidTimestamp);
  for (const split of open) {
    const cents = Math.round(Number(split.amount) * 100);
    net.set(split.userName, (net.get(split.userName) ?? 0) - cents);
    net.set(split.whoPaid, (net.get(split.whoPaid) ?? 0) + cents);
  }
  return net;
}

export function balanceChangeBetween(
  before: ExpenseData[],
  after: ExpenseData[],
  tripCurrency: string,
  isPaidTimestamp?: number,
  afterIsPaidTimestamp: number | undefined = isPaidTimestamp
): BalanceChange[] {
  const was = netCents(before, tripCurrency, isPaidTimestamp);
  const now = netCents(after, tripCurrency, afterIsPaidTimestamp);
  const names = new Set([...was.keys(), ...now.keys()]);
  const changes: BalanceChange[] = [];
  for (const userName of names) {
    const cents = (now.get(userName) ?? 0) - (was.get(userName) ?? 0);
    if (cents !== 0) changes.push({ userName, amount: cents / 100 });
  }
  return changes.sort((a, b) => b.amount - a.amount);
}

const dayKey = (expense: ExpenseData): string =>
  new Date((expense.date ?? expense.startDate) as Date | string).toISOString().slice(0, 10);

/** Groups a change to several **Ranged expense** days; null when it is not one. */
function describeRangedChange(
  before: ExpenseData[],
  after: ExpenseData[],
  siblings: ExpenseData[]
): { range: SplitHistoryRange; grouped: boolean } | null {
  const involved = [...before, ...after];
  const anchor = [...after, ...before].find((e) => e.rangeId);
  if (!anchor?.rangeId) return null;
  const rangeId = anchor.rangeId;
  const inRange = [
    ...involved,
    ...siblings.filter((e) => !e.isDeleted),
  ].filter((e) => e.rangeId === rangeId);
  const dates = inRange.map(dayKey).sort();
  const distinct = new Set(involved.map((e) => e.id ?? dayKey(e)));
  return {
    range: { rangeId, startDate: dates[0], endDate: dates[dates.length - 1] },
    grouped: distinct.size > 1,
  };
}

function balanceChangesByDay(
  before: ExpenseData[],
  after: ExpenseData[],
  tripCurrency: string,
  isPaidTimestamp?: number
): { days: SplitHistoryDay[]; total: BalanceChange[] } {
  const dates = [...new Set([...before, ...after].map(dayKey))].sort();
  const days: SplitHistoryDay[] = [];
  const totals = new Map<string, number>();
  for (const date of dates) {
    const balanceChanges = balanceChangeBetween(
      before.filter((e) => dayKey(e) === date),
      after.filter((e) => dayKey(e) === date),
      tripCurrency,
      isPaidTimestamp
    );
    if (balanceChanges.length === 0) continue;
    days.push({ date, balanceChanges });
    for (const c of balanceChanges) {
      totals.set(c.userName, (totals.get(c.userName) ?? 0) + Math.round(c.amount * 100));
    }
  }
  const total = [...totals]
    .filter(([, cents]) => cents !== 0)
    .map(([userName, cents]) => ({ userName, amount: cents / 100 }))
    .sort((a, b) => b.amount - a.amount);
  return { days, total };
}

export function buildSplitHistoryEntry({
  kind,
  description,
  before,
  after,
  tripCurrency,
  isPaidTimestamp,
  afterIsPaidTimestamp,
  author,
  now = Date.now(),
  rangeSiblings = [],
}: {
  kind: SplitHistoryKind;
  description: string;
  /** The trip's expenses (or just the affected ones) before the change. */
  before: ExpenseData[];
  /** ... and after the change. */
  after: ExpenseData[];
  tripCurrency: string;
  isPaidTimestamp?: number;
  /** Set only for a **Settlement**, which moves the trip's timestamp. */
  afterIsPaidTimestamp?: number;
  author: SplitHistoryAuthor;
  now?: number;
  /** The trip's expenses, so a change to one day knows its whole range. */
  rangeSiblings?: ExpenseData[];
}): SplitHistoryEntry | null {
  const ranged =
    afterIsPaidTimestamp === undefined
      ? describeRangedChange(before, after, rangeSiblings)
      : null;
  let balanceChanges: BalanceChange[];
  let days: SplitHistoryDay[] | undefined;
  if (ranged?.grouped) {
    const byDay = balanceChangesByDay(before, after, tripCurrency, isPaidTimestamp);
    balanceChanges = byDay.total;
    days = byDay.days;
  } else {
    balanceChanges = balanceChangeBetween(
      before,
      after,
      tripCurrency,
      isPaidTimestamp,
      afterIsPaidTimestamp ?? isPaidTimestamp
    );
  }
  if (balanceChanges.length === 0) return null;
  return {
    id: newSplitHistoryId(now),
    kind,
    description,
    byUid: author.uid,
    byName: author.userName,
    timestamp: now,
    tripCurrency,
    balanceChanges,
    ...(ranged ? { range: ranged.range } : {}),
    ...(days ? { days } : {}),
  };
}

/**
 * Entry for one edited **Expense**: **Paid back** when the edit moved it from
 * open to paid back, otherwise an edit. Null when the Split Summary is unchanged.
 */
export function buildExpenseEditEntry({
  before,
  after,
  ...rest
}: {
  before: ExpenseData;
  after: ExpenseData;
  tripCurrency: string;
  isPaidTimestamp?: number;
  author: SplitHistoryAuthor;
  now?: number;
  rangeSiblings?: ExpenseData[];
}): SplitHistoryEntry | null {
  return buildExpensesEditEntry({ before: [before], after: [after], ...rest });
}

/**
 * Entry for several edited days of one **Ranged expense**, grouped as one
 * entry. **Paid back** when every day moved from open to paid back.
 */
export function buildExpensesEditEntry({
  before,
  after,
  tripCurrency,
  isPaidTimestamp,
  author,
  now,
  rangeSiblings,
}: {
  before: ExpenseData[];
  after: ExpenseData[];
  tripCurrency: string;
  isPaidTimestamp?: number;
  author: SplitHistoryAuthor;
  now?: number;
  rangeSiblings?: ExpenseData[];
}): SplitHistoryEntry | null {
  const wasOpen = before.every(
    (e) => getEffectivePaidBack(e, isPaidTimestamp) !== paidBackStatus.paid
  );
  const nowPaid = after.every(
    (e) => getEffectivePaidBack(e, isPaidTimestamp) === paidBackStatus.paid
  );
  return buildSplitHistoryEntry({
    kind: wasOpen && nowPaid ? "paidBack" : "edited",
    description: after[0]?.description ?? before[0]?.description ?? "",
    before,
    after,
    tripCurrency,
    isPaidTimestamp,
    author,
    now,
    rangeSiblings,
  });
}
