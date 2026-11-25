/**
 * Delete and Undo write exactly one split history entry per user action,
 * checked against the Split Summary harness (#435).
 */
import {
  clearPendingUndoDelete,
  collectUserDeleteTargets,
  deleteUserExpenses,
} from "../../util/user-delete-expense";
import type { SplitHistoryEntry } from "../../util/split-history";
import {
  addExpense,
  buildExpense,
  computeSplitSummary,
  expenseCtxFor,
  makeTrip,
  resetHarnessIds,
  type SplitSummaryTrip,
} from "../fixtures/split-summary";
import Toast from "react-native-toast-message";

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));
jest.mock("../../util/http", () => ({
  touchAllTravelers: jest.fn(async () => undefined),
}));
jest.mock("../../util/offline-queue", () => ({
  deleteExpenseOnlineOffline: jest.fn(async () => undefined),
  restoreExpenseOnlineOffline: jest.fn(async () => undefined),
}));

import {
  deleteExpenseOnlineOffline,
  restoreExpenseOnlineOffline,
} from "../../util/offline-queue";

const day = (d: number) => new Date(Date.UTC(2026, 0, d, 12));
const author = { uid: "u1", userName: "Alice" };

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
  resetHarnessIds();
  jest.clearAllMocks();
});
afterEach(() => {
  clearPendingUndoDelete();
  jest.useRealTimers();
});

function historyOf(mock: jest.Mock): SplitHistoryEntry[] {
  return mock.mock.calls
    .map(([item]) => item.historyEntry)
    .filter(Boolean);
}

async function userDelete(trip: SplitSummaryTrip, id: string) {
  const ctx = expenseCtxFor(trip);
  await deleteUserExpenses({
    tripid: "t1",
    targets: collectUserDeleteTargets("t1", trip.expenses, [id]),
    isOnline: true,
    expenseCtx: ctx,
    history: {
      expenses: ctx.expenses,
      tripCurrency: trip.tripCurrency,
      isPaidTimestamp: trip.isPaidTimestamp,
      author,
    },
  });
}

async function userUndo() {
  const call = (Toast.show as jest.Mock).mock.calls.find(
    ([arg]) => arg.type === "deletedExpense"
  );
  await call[0].props.onUndo();
}

describe("split history for delete and undo", () => {
  it("delete writes one entry reversing the Balance the Expense caused", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [dinner] = addExpense(
      trip,
      buildExpense(trip, { amount: 100, whoPaid: "Alice", description: "Dinner" })
    );

    await userDelete(trip, dinner.id as string);

    const entries = historyOf(deleteExpenseOnlineOffline as jest.Mock);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: "deleted", description: "Dinner", byName: "Alice" });
    expect(entries[0].balanceChanges).toEqual([
      { userName: "Bob", amount: 50 },
      { userName: "Alice", amount: -50 },
    ]);
    expect(computeSplitSummary(trip).balances).toEqual([]);
  });

  it("undo writes one entry restoring the Balance, so delete + undo net to zero", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [dinner] = addExpense(
      trip,
      buildExpense(trip, { amount: 100, whoPaid: "Alice", description: "Dinner" })
    );
    await userDelete(trip, dinner.id as string);

    await userUndo();

    const undone = historyOf(restoreExpenseOnlineOffline as jest.Mock);
    expect(undone).toHaveLength(1);
    expect(undone[0]).toMatchObject({ kind: "undone", description: "Dinner" });
    expect(undone[0].balanceChanges).toEqual([
      { userName: "Alice", amount: 50 },
      { userName: "Bob", amount: -50 },
    ]);
  });

  it("deleting a Ranged expense is one user action: one entry with the whole Balance change", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [first] = addExpense(
      trip,
      buildExpense(trip, { amount: 30, whoPaid: "Alice", description: "Hostel" }),
      { dates: [day(1), day(2), day(3)], rangeId: "r1" }
    );

    await userDelete(trip, first.id as string);

    const entries = historyOf(deleteExpenseOnlineOffline as jest.Mock);
    expect(entries).toHaveLength(1);
    expect(entries[0].balanceChanges).toEqual([
      { userName: "Bob", amount: 45 },
      { userName: "Alice", amount: -45 },
    ]);
    expect(
      (deleteExpenseOnlineOffline as jest.Mock).mock.calls
    ).toHaveLength(3);
  });

  it("an Expense that does not touch the Split Summary writes no entry", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [self] = addExpense(
      trip,
      buildExpense(trip, { amount: 10, whoPaid: "Alice", splitType: "SELF", splitList: [] })
    );

    await userDelete(trip, self.id as string);

    expect(historyOf(deleteExpenseOnlineOffline as jest.Mock)).toHaveLength(0);
  });

  it("deleting and undoing one day of a range labels both entries with the whole range", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const days = addExpense(
      trip,
      buildExpense(trip, { amount: 30, whoPaid: "Alice", description: "Hostel" }),
      { dates: [day(1), day(2), day(3)], rangeId: "r1" }
    );
    const ctx = expenseCtxFor(trip);
    await deleteUserExpenses({
      tripid: "t1",
      targets: collectUserDeleteTargets("t1", trip.expenses, [days[1].id as string]).filter(
        (t) => t.id === days[1].id
      ),
      isOnline: true,
      expenseCtx: ctx,
      history: {
        expenses: ctx.expenses,
        tripCurrency: trip.tripCurrency,
        isPaidTimestamp: trip.isPaidTimestamp,
        author,
      },
    });
    await userUndo();

    const range = { rangeId: "r1", startDate: "2026-01-01", endDate: "2026-01-03" };
    expect(historyOf(deleteExpenseOnlineOffline as jest.Mock)[0].range).toEqual(range);
    expect(historyOf(restoreExpenseOnlineOffline as jest.Mock)[0].range).toEqual(range);
  });
});
