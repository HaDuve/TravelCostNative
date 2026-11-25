import {
  activeExpenses,
  expensesReducer,
} from "../../store/expenses-context";
import { expandRangedExpense } from "../../util/expand-ranged-expense";
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
    expect({ label, pair: sortKey(b), within: Math.abs(b.amount - e[i].amount) <= MINOR_UNIT + 1e-9 })
      .toEqual({ label, pair: sortKey(b), within: true });
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
