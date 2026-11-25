/**
 * A change to a Ranged expense writes ONE grouped split history entry: the
 * date range, the combined Balance change and a per-day breakdown that sums
 * to it (#438). Editing a single day is its own entry, labelled with its range.
 */
jest.mock("react-native-toast-message", () => ({ show: jest.fn(), hide: jest.fn() }));
jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => ({ isFastEnough: true })),
}));
jest.mock("../../util/active-trip-id", () => ({
  getActiveTripId: jest.fn(async () => "trip-1"),
}));
jest.mock("../../util/http", () => ({
  storeExpenseWithId: jest.fn(async (_t, _u, id) => id),
  updateExpense: jest.fn(async () => undefined),
  deleteExpense: jest.fn(async () => undefined),
  appendSplitHistoryEntry: jest.fn(async () => undefined),
}));
jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: { OFFLINE_QUEUE: "offlineQueue" },
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
}));

import { appendSplitHistoryEntry } from "../../util/http";
import {
  persistRangedExpenseAdd,
  persistRangedExpenseInPlaceEdit,
  persistRangedExpenseReplace,
} from "../../util/ranged-expense-persist";
import { expandRangedExpense } from "../../util/expand-ranged-expense";
import { collectUserDeleteTargets } from "../../util/user-delete-expense";
import {
  addExpense,
  buildExpense,
  makeTrip,
  resetHarnessIds,
} from "../fixtures/split-summary";

const day = (d: number) => new Date(Date.UTC(2026, 0, d, 12));
const ctx = () => ({
  addExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
});
const entries = () =>
  (appendSplitHistoryEntry as jest.Mock).mock.calls.map(([, e]) => e);

beforeEach(() => {
  jest.clearAllMocks();
  resetHarnessIds();
});

describe("split history for Ranged expenses", () => {
  it("adding a 3-day Ranged expense writes one grouped entry with range, total and per-day lines", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const instances = expandRangedExpense(
      buildExpense(trip, { amount: 30, whoPaid: "Alice", description: "Hostel" }),
      { dates: [day(1), day(2), day(3)], rangeId: "r1" }
    );

    await persistRangedExpenseAdd(instances, {
      tripid: "trip-1",
      uid: "u1",
      isOnline: true,
      expenseCtx: ctx(),
      history: {
        expenses: [],
        tripCurrency: "EUR",
        isPaidTimestamp: 0,
        author: { uid: "u1", userName: "Alice" },
      },
    }).syncPromise;

    const written = entries();
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({
      kind: "added",
      description: "Hostel",
      range: { rangeId: "r1", startDate: "2026-01-01", endDate: "2026-01-03" },
    });
    expect(written[0].balanceChanges).toEqual([
      { userName: "Alice", amount: 45 },
      { userName: "Bob", amount: -45 },
    ]);
    expect(written[0].days.map((d: { date: string }) => d.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
    for (const d of written[0].days) {
      expect(d.balanceChanges).toEqual([
        { userName: "Alice", amount: 15 },
        { userName: "Bob", amount: -15 },
      ]);
    }
  });

  it("an in-place edit of the whole range writes one grouped entry whose days sum to the total", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const days = addExpense(
      trip,
      buildExpense(trip, { amount: 20, whoPaid: "Alice" }),
      { dates: [day(1), day(2)], rangeId: "r1" }
    );
    const updates = days.map((d) => ({
      id: d.id as string,
      expenseData: { ...d, amount: 40, calcAmount: 40, splitList: [{ userName: "Alice", amount: 20 }, { userName: "Bob", amount: 20 }] },
    }));

    await persistRangedExpenseInPlaceEdit(updates, {
      tripid: "trip-1",
      uid: "u1",
      isOnline: true,
      expenseCtx: ctx(),
      history: {
        expenses: days,
        tripCurrency: "EUR",
        isPaidTimestamp: 0,
        author: { uid: "u1", userName: "Alice" },
      },
    }).syncPromise;

    const written = entries();
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({
      kind: "edited",
      range: { rangeId: "r1", startDate: "2026-01-01", endDate: "2026-01-02" },
    });
    expect(written[0].balanceChanges[0]).toEqual({ userName: "Alice", amount: 20 });
    expect(written[0].days).toHaveLength(2);
    const dayTotal = written[0].days.reduce(
      (sum: number, d: { balanceChanges: { userName: string; amount: number }[] }) =>
        sum + (d.balanceChanges.find((c) => c.userName === "Alice")?.amount ?? 0),
      0
    );
    expect(dayTotal).toBe(20);
  });

  it("editing a single day is its own entry, labelled with the range it belongs to", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const days = addExpense(
      trip,
      buildExpense(trip, { amount: 20, whoPaid: "Alice", description: "Hostel" }),
      { dates: [day(1), day(2), day(3)], rangeId: "r1" }
    );
    const edited = {
      ...days[1],
      amount: 40,
      calcAmount: 40,
      splitList: [{ userName: "Alice", amount: 20 }, { userName: "Bob", amount: 20 }],
    };

    await persistRangedExpenseInPlaceEdit(
      [{ id: days[1].id as string, expenseData: edited }],
      {
        tripid: "trip-1",
        uid: "u1",
        isOnline: true,
        expenseCtx: ctx(),
        history: {
          expenses: days,
          tripCurrency: "EUR",
          isPaidTimestamp: 0,
          author: { uid: "u1", userName: "Alice" },
        },
      }
    ).syncPromise;

    const written = entries();
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({
      kind: "edited",
      range: { rangeId: "r1", startDate: "2026-01-01", endDate: "2026-01-03" },
    });
    expect(written[0].days).toBeUndefined();
    expect(written[0].balanceChanges[0]).toEqual({ userName: "Alice", amount: 10 });
  });

  it("replacing the days writes a single edit entry with the net Balance change", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const old = addExpense(
      trip,
      buildExpense(trip, { amount: 10, whoPaid: "Alice", description: "Hostel" }),
      { dates: [day(1), day(2)], rangeId: "r1" }
    );
    const targets = collectUserDeleteTargets("trip-1", old, [old[0].id as string]);
    const fresh = expandRangedExpense(
      buildExpense(trip, { amount: 30, whoPaid: "Alice", description: "Hostel" }),
      { dates: [day(1), day(2), day(3)], rangeId: "r2" }
    );

    await persistRangedExpenseReplace(targets, fresh, {
      tripid: "trip-1",
      uid: "u1",
      isOnline: true,
      expenseCtx: ctx(),
      history: {
        expenses: old,
        tripCurrency: "EUR",
        isPaidTimestamp: 0,
        author: { uid: "u1", userName: "Alice" },
      },
    }).syncPromise;

    const written = entries();
    expect(written).toHaveLength(1);
    // Each day keeps the full amount (duplicate mode). Old: 2 x 10 -> Bob owes 10. New: 3 x 30 -> Bob owes 45.
    expect(written[0]).toMatchObject({ kind: "edited", description: "Hostel" });
    expect(written[0].balanceChanges).toEqual([
      { userName: "Alice", amount: 35 },
      { userName: "Bob", amount: -35 },
    ]);
    expect(written[0].range).toMatchObject({ startDate: "2026-01-01", endDate: "2026-01-03" });
    const perDay = written[0].days.map(
      (d: { balanceChanges: { userName: string; amount: number }[] }) =>
        d.balanceChanges.find((c) => c.userName === "Alice")?.amount
    );
    expect(perDay).toEqual([10, 10, 15]);
  });
});
