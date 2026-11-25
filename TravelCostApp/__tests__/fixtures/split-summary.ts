import {
  activeExpenses,
  expensesReducer,
} from "../../store/expenses-context";
import { applySubmitRate, persistExpenseEdit } from "../../util/edit-expense";
import { expandRangedExpense } from "../../util/expand-ranged-expense";
import { buildRangedExpenseDatesFromSpan } from "../../util/plan-ranged-expense-edit";
import { resolveAlreadyDividedAmountByDays } from "../../util/expense-form-range";
import {
  paidBackStatus,
  type ExpenseData,
  type Split,
} from "../../util/expense";
import { rollupOpenBalances, simplifySplits } from "../../util/split";
import { makeExpense } from "./expense";

/** Tolerance: one minor currency unit (cent). */
export const MINOR_UNIT = 0.01;

/**
 * A **Trip** under test: its **Trip currency**, **Travellers**, and the
 * expenses list (including **Deleted expense** tombstones), mutated through
 * the same `expensesReducer` the app uses.
 */
export type SplitSummaryTrip = {
  tripCurrency: string;
  travellers: string[];
  expenses: ExpenseData[];
  /** Trip-wide **Settlement** timestamp (`isPaidTimestamp`), 0 = never settled. */
  isPaidTimestamp: number;
};

export type ExpectedBalance = {
  /** The traveller who owes. */
  from: string;
  /** The traveller who is owed (**Who paid**). */
  to: string;
  amount: number;
};

export type ExpectedSplitSummary = {
  /** Hand-computed open **Balances**. Empty array = all square. */
  balances: ExpectedBalance[];
  /** Hand-computed **Balance simplification** payments, when relevant. */
  simplified?: ExpectedBalance[];
};

export function makeTrip(
  travellers: string[] = ["Alice", "Bob"],
  tripCurrency = "EUR"
): SplitSummaryTrip {
  if (travellers.length < 2 || travellers.length > 4) {
    throw new Error("Split Summary harness trips use 2-4 Travellers");
  }
  return { tripCurrency, travellers, expenses: [], isPaidTimestamp: 0 };
}

let nextId = 1;
export function resetHarnessIds(): void {
  nextId = 1;
}

/** Equal **Split** amounts among `among`, rounded like the Expense form. */
export function equalSplit(amount: number, among: string[]): Split[] {
  return among.map((userName) => ({
    userName,
    amount: Number((amount / among.length).toFixed(2)),
  }));
}

/** Builds a test Expense (EQUAL split among all travellers by default). */
export function buildExpense(
  trip: SplitSummaryTrip,
  overrides: Partial<ExpenseData> = {}
): ExpenseData {
  const amount = overrides.amount ?? 100;
  const whoPaid = overrides.whoPaid ?? trip.travellers[0];
  return makeExpense({
    currency: trip.tripCurrency,
    amount,
    calcAmount: amount,
    whoPaid,
    splitType: "EQUAL",
    splitList: equalSplit(amount, trip.travellers),
    listEQUAL: trip.travellers,
    id: undefined,
    ...overrides,
  });
}

/**
 * Adds an Expense like the submit path: a **Ranged expense** is expanded into
 * per-day records, then each record goes through the ADD reducer action.
 */
export function addExpense(
  trip: SplitSummaryTrip,
  expense: ExpenseData,
  range?: { dates: Date[]; rangeId: string }
): ExpenseData[] {
  const records = range
    ? expandRangedExpense(expense, range)
    : [{ ...expense, rangeId: undefined }];
  const added = records.map((record) => ({
    ...record,
    id: record.id && !range ? record.id : `exp-${nextId++}`,
    uid: record.uid ?? "u1",
  }));
  // Mirrors submit order: each record dispatched as ADD.
  for (const record of added) {
    trip.expenses = expensesReducer(trip.expenses, {
      type: "ADD",
      payload: record,
    });
  }
  return added;
}

/** Adds a **Ranged expense** spanning `startDate`..`endDate` (inclusive days), like the submit path. */
export function addRangedExpense(
  trip: SplitSummaryTrip,
  overrides: Partial<ExpenseData>,
  startDate: Date,
  endDate: Date,
  rangeId = "r1"
): ExpenseData[] {
  const expense = buildExpense(trip, { ...overrides, startDate, endDate, date: startDate });
  return addExpense(trip, expense, {
    dates: buildRangedExpenseDatesFromSpan(startDate, endDate),
    rangeId,
  });
}

/** Store context slice the edit path (`persistExpenseEdit`) writes to. */
export function editCtxFor(trip: SplitSummaryTrip) {
  return {
    get expenses() {
      return activeExpenses(trip.expenses);
    },
    addExpense: (expense: ExpenseData) => {
      trip.expenses = expensesReducer(trip.expenses, { type: "ADD", payload: expense });
    },
    updateExpense: (id: string, data: ExpenseData) => {
      trip.expenses = expensesReducer(trip.expenses, { type: "UPDATE", payload: { id, data } });
    },
    deleteExpense: (id: string) => {
      trip.expenses = expensesReducer(trip.expenses, { type: "DELETE", payload: id });
    },
  };
}

/** Fields the Expense form never submits (ids, range membership, sync stamps). */
const NON_FORM_FIELDS = ["id", "rangeId", "editedTimestamp", "serverTimestamp", "isDeleted"] as const;

/**
 * Edits an Expense like ExpenseForm + ManageExpense: the form payload is the
 * stored Expense with `changes` applied, then submit-time FX (`rate` = Trip
 * currency per Expense currency unit) and `persistExpenseEdit`.
 * For a **Ranged split** the stored values are per-day, as the form shows them.
 */
export async function editExpense(
  trip: SplitSummaryTrip,
  id: string,
  changes: Partial<ExpenseData> & { alreadyDividedAmountByDays?: boolean },
  { rate = 1, isOnline = true, replace = false } = {}
): Promise<void> {
  const selectedExpense = trip.expenses.find((e) => e.id === id)!;
  const payload: ExpenseData & { alreadyDividedAmountByDays?: boolean } = {
    ...(replace ? {} : selectedExpense),
    ...changes,
  } as ExpenseData & { alreadyDividedAmountByDays?: boolean };
  for (const key of NON_FORM_FIELDS) delete payload[key];
  payload.splitList = payload.splitList?.map((split) => ({ ...split }));
  // Args mirror the form when editing: (isEditing = true, the stored
  // duplOrSplit, isDuplicateFirstEdit = false). An explicit change overrides it.
  payload.alreadyDividedAmountByDays =
    changes.alreadyDividedAmountByDays ??
    resolveAlreadyDividedAmountByDays(true, payload.duplOrSplit, false);
  applySubmitRate(payload, rate);
  let n = 0;
  await persistExpenseEdit({
    tripid: "t1",
    uid: "u1",
    isOnline,
    expenseCtx: editCtxFor(trip),
    selectedExpense,
    selectedExpenseAuthorUid: selectedExpense.uid ?? "u1",
    expenseData: payload,
    newRangeId: () => `edit-range-${nextId++}-${n++}`,
  });
}

/** Marks a single Expense **Paid back** (UPDATE action, as the UI does). */
export function markPaidBack(trip: SplitSummaryTrip, id: string): void {
  trip.expenses = expensesReducer(trip.expenses, {
    type: "UPDATE",
    payload: { id, data: { paidBack: paidBackStatus.paid } },
  });
}

/** Adapter exposing the trip's reducer as the store context slice the UI passes to delete/undo. */
export function expenseCtxFor(trip: SplitSummaryTrip) {
  return {
    get expenses() {
      return activeExpenses(trip.expenses);
    },
    deleteExpense: (id: string) => {
      trip.expenses = expensesReducer(trip.expenses, {
        type: "DELETE",
        payload: id,
      });
    },
    restoreExpenses: (ids: string[]) => {
      for (const id of ids) {
        trip.expenses = expensesReducer(trip.expenses, {
          type: "RESTORE",
          payload: id,
        });
      }
    },
  };
}

type Net = Record<string, number>;

function netPositions(balances: ExpectedBalance[], travellers: string[]): Net {
  const net: Net = Object.fromEntries(travellers.map((t) => [t, 0]));
  for (const b of balances) {
    net[b.from] = (net[b.from] ?? 0) - b.amount;
    net[b.to] = (net[b.to] ?? 0) + b.amount;
  }
  return net;
}

function sumOfNet(net: Net): number {
  return Object.values(net).reduce((a, b) => a + b, 0);
}

/** Recomputes the open **Balances** from scratch, as Split Summary does. */
export function computeSplitSummary(trip: SplitSummaryTrip): {
  balances: ExpectedBalance[];
  simplified: ExpectedBalance[];
} {
  const open = rollupOpenBalances(
    activeExpenses(trip.expenses),
    trip.tripCurrency,
    trip.isPaidTimestamp
  );
  const toExpected = (s: Split): ExpectedBalance => ({
    from: s.userName,
    to: s.whoPaid as string,
    amount: Number(s.amount),
  });
  return {
    balances: open.map(toExpected),
    simplified: simplifySplits(open).map(toExpected),
  };
}

function sortKey(b: ExpectedBalance): string {
  return `${b.from}->${b.to}`;
}

function expectSameBalances(
  actual: ExpectedBalance[],
  expected: ExpectedBalance[],
  label: string
): void {
  const clean = (list: ExpectedBalance[]) =>
    list.filter((b) => Math.abs(b.amount) >= MINOR_UNIT / 2);
  const a = clean(actual).sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
  const e = clean(expected).sort((x, y) =>
    sortKey(x).localeCompare(sortKey(y))
  );
  expect({ label, pairs: a.map(sortKey) }).toEqual({
    label,
    pairs: e.map(sortKey),
  });
  a.forEach((b, i) => {
    const diff = Math.abs(b.amount - e[i].amount);
    try {
      expect(diff).toBeLessThanOrEqual(MINOR_UNIT + 1e-9);
    } catch (err) {
      // Prefix the matcher failure with which Balance differs.
      (err as Error).message =
        `${label} ${sortKey(b)}: got ${b.amount}, expected ${e[i].amount}\n` +
        (err as Error).message;
      throw err;
    }
  });
}

/**
 * Recomputes the Split Summary from scratch and compares it with the
 * hand-computed expectation (tolerance: one minor currency unit).
 * Always checks the zero-sum invariant and that **Balance simplification**
 * preserves each Traveller's net position.
 */
export function expectSplitSummary(
  trip: SplitSummaryTrip,
  expected: ExpectedSplitSummary
): void {
  const { balances, simplified } = computeSplitSummary(trip);

  expectSameBalances(balances, expected.balances, "balances");
  if (expected.simplified) {
    expectSameBalances(simplified, expected.simplified, "simplified");
  }

  // Invariant: Balances sum to zero across Travellers.
  const net = netPositions(balances, trip.travellers);
  expect(Math.abs(sumOfNet(net))).toBeLessThanOrEqual(MINOR_UNIT);

  // Invariant: simplification keeps net positions (no money created/lost).
  const simpleNet = netPositions(simplified, trip.travellers);
  expect(Math.abs(sumOfNet(simpleNet))).toBeLessThanOrEqual(MINOR_UNIT);
  for (const t of trip.travellers) {
    expect(Math.abs(simpleNet[t] - net[t])).toBeLessThanOrEqual(
      MINOR_UNIT * trip.travellers.length
    );
  }
}

/**
 * Asserts the issue-#436 invariant: the Split Summary after editing equals the
 * one from deleting the old Expense and adding the edited one from scratch,
 * and both match the hand-computed expectation (which includes the zero-sum check).
 */
export function expectEditEqualsDeleteAndReAdd(
  edited: SplitSummaryTrip,
  reAdded: SplitSummaryTrip,
  expected: ExpectedSplitSummary
): void {
  expectSplitSummary(reAdded, expected);
  expectSplitSummary(edited, expected);
  const a = computeSplitSummary(edited);
  const b = computeSplitSummary(reAdded);
  expectSameBalances(a.balances, b.balances, "edit vs delete+re-add");
  expectSameBalances(a.simplified, b.simplified, "edit vs delete+re-add (simplified)");
}
