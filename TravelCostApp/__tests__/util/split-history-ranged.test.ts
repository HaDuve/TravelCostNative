/**
 * Ranged expenses still produce split history entries; until #438 they show
 * as one entry per day (add) or one per changed record (edit), and a replace
 * (delete old days + add new days) is a single edit entry.
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
  it("adding a 3-day Ranged expense writes one entry per day", async () => {
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
    expect(written).toHaveLength(3);
    for (const e of written) {
      expect(e).toMatchObject({ kind: "added", description: "Hostel" });
      expect(e.balanceChanges).toEqual([
        { userName: "Alice", amount: 15 },
        { userName: "Bob", amount: -15 },
      ]);
    }
  });

  it("an in-place edit writes one entry per changed day", async () => {
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
    expect(written).toHaveLength(2);
    expect(written.map((e) => e.kind)).toEqual(["edited", "edited"]);
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
  });
});
