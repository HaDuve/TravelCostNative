/**
 * Split Summary after an offline edit and concurrent edits (#436).
 *
 * The real edit path (persistExpenseEdit) and the real offline queue
 * (updateExpenseOnlineOffline / sendOfflineQueue) run against mocked
 * boundaries only: MMKV storage, network state and the RTDB write helpers.
 */
const mmkvStore: Record<string, unknown> = {};
jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: { OFFLINE_QUEUE: "offlineQueue" },
  getMMKVString: jest.fn(),
  setMMKVString: jest.fn(),
  getMMKVObject: jest.fn((key: string) => mmkvStore[key] ?? null),
  setMMKVObject: jest.fn((key: string, value: unknown) => {
    mmkvStore[key] = value;
  }),
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(async () => ({ isConnected: true })),
}));
jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("../../util/active-trip-id", () => ({
  getActiveTripId: jest.fn(async () => "t1"),
}));
jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => ({ isFastEnough: true })),
}));
jest.mock("../../util/http", () => ({
  storeExpense: jest.fn(),
  storeExpenseWithId: jest.fn(),
  updateExpense: jest.fn(async () => undefined),
  deleteExpense: jest.fn(async () => undefined),
  restoreExpense: jest.fn(async () => undefined),
  touchAllTravelers: jest.fn(async () => undefined),
}));

import { updateExpense } from "../../util/http";
import { sendOfflineQueue } from "../../util/offline-queue";
import { expensesReducer } from "../../store/expenses-context";
import {
  addExpense,
  buildExpense,
  computeSplitSummary,
  editExpense,
  equalSplit,
  expectSplitSummary,
  makeTrip,
  resetHarnessIds,
} from "../fixtures/split-summary";

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
  resetHarnessIds();
  delete mmkvStore.offlineQueue;
  (updateExpense as jest.Mock).mockClear();
});
afterEach(() => jest.useRealTimers());

function seedSyncedExpense() {
  const trip = makeTrip(["Alice", "Bob"]);
  const [seeded] = addExpense(trip, buildExpense(trip, { id: "target", amount: 100 }));
  trip.expenses = trip.expenses.map((e) => ({ ...e, serverTimestamp: 1000 }));
  return { trip, id: seeded.id!, old: trip.expenses[0] };
}

describe("Split Summary: an Expense edited offline", () => {
  it("is queued once, replayed once, and not applied twice when the server copy is merged", async () => {
    const { trip, id, old } = seedSyncedExpense();

    await editExpense(
      trip,
      id,
      { amount: 60, splitList: equalSplit(60, ["Alice", "Bob"]) },
      { isOnline: false }
    );
    const afterEdit = computeSplitSummary(trip);
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 30 }] });

    const queue = mmkvStore.offlineQueue as { type: string; expense: any }[];
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("update");
    expect(updateExpense).not.toHaveBeenCalled();

    // Back online: the queue is replayed against the (mocked) RTDB.
    await sendOfflineQueue(false, jest.fn());
    expect(updateExpense).toHaveBeenCalledTimes(1);
    const [tripid, , expenseId, sent] = (updateExpense as jest.Mock).mock.calls[0];
    expect([tripid, expenseId]).toEqual(["t1", id]);
    expect(mmkvStore.offlineQueue).toEqual([]);

    // Fetch returns the stale server copy first, then the replayed edit
    // (server-stamped), twice. Balances and row count never change.
    trip.expenses = expensesReducer(trip.expenses, { type: "MERGE", payload: [old] });
    expect(computeSplitSummary(trip)).toEqual(afterEdit);
    const synced = { ...old, ...sent, id, serverTimestamp: 2000 };
    for (let i = 0; i < 2; i++) {
      trip.expenses = expensesReducer(trip.expenses, { type: "MERGE", payload: [synced] });
    }
    expect(computeSplitSummary(trip)).toEqual(afterEdit);
    expect(trip.expenses).toHaveLength(1);
  });
});

describe("Split Summary: local edit versus a concurrent edit by another Traveller", () => {
  it("the newer remote copy wins over a stale local edit (ordering by serverTimestamp)", async () => {
    const { trip, id, old } = seedSyncedExpense();
    await editExpense(trip, id, { amount: 60, splitList: equalSplit(60, ["Alice", "Bob"]) });

    // Bob edited the same Expense later, on the server.
    const remote = {
      ...old,
      amount: 40,
      calcAmount: 40,
      splitList: equalSplit(40, ["Alice", "Bob"]),
      serverTimestamp: Date.now() + 5000,
    };
    trip.expenses = expensesReducer(trip.expenses, { type: "MERGE", payload: [remote] });

    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 20 }] });
  });

  // Known bug (#447): expensesReducer MERGE compares the remote
  // serverTimestamp with the local serverTimestamp (stale, from the last sync)
  // before the local editedTimestamp, so a remote copy older than the local
  // edit but newer than the last sync overwrites the local edit.
  it.failing("an older remote copy does not overwrite the local edit", async () => {
    const { trip, id, old } = seedSyncedExpense();
    await editExpense(trip, id, { amount: 60, splitList: equalSplit(60, ["Alice", "Bob"]) });

    const staleRemote = {
      ...old,
      amount: 40,
      calcAmount: 40,
      splitList: equalSplit(40, ["Alice", "Bob"]),
      serverTimestamp: 1500,
    };
    trip.expenses = expensesReducer(trip.expenses, { type: "MERGE", payload: [staleRemote] });

    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 30 }] });
  });
});
