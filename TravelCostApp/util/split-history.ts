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
}

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
}): SplitHistoryEntry | null {
  const balanceChanges = balanceChangeBetween(
    before,
    after,
    tripCurrency,
    isPaidTimestamp,
    afterIsPaidTimestamp ?? isPaidTimestamp
  );
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
  };
}

/**
 * Entry for one edited **Expense**: **Paid back** when the edit moved it from
 * open to paid back, otherwise an edit. Null when the Split Summary is unchanged.
 */
export function buildExpenseEditEntry({
  before,
  after,
  tripCurrency,
  isPaidTimestamp,
  author,
  now,
}: {
  before: ExpenseData;
  after: ExpenseData;
  tripCurrency: string;
  isPaidTimestamp?: number;
  author: SplitHistoryAuthor;
  now?: number;
}): SplitHistoryEntry | null {
  const wasOpen =
    getEffectivePaidBack(before, isPaidTimestamp) !== paidBackStatus.paid;
  const nowPaid = getEffectivePaidBack(after, isPaidTimestamp) === paidBackStatus.paid;
  return buildSplitHistoryEntry({
    kind: wasOpen && nowPaid ? "paidBack" : "edited",
    description: after.description,
    before: [before],
    after: [after],
    tripCurrency,
    isPaidTimestamp,
    author,
    now,
  });
}
