/**
 * Split history rides the same save path as the Expense change: online it is
 * appended right after the Expense write, offline it waits in the offline
 * queue next to the Expense change and syncs with it.
 */
jest.mock("react-native-toast-message", () => ({ show: jest.fn(), hide: jest.fn() }));
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(async () => ({ isConnected: true })),
}));
jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => ({ isFastEnough: true })),
}));
jest.mock("../../util/active-trip-id", () => ({
  getActiveTripId: jest.fn(async () => "trip-1"),
}));
jest.mock("../../util/http", () => ({
  storeExpense: jest.fn(),
  storeExpenseWithId: jest.fn(async (_t, _u, id) => id),
  updateExpense: jest.fn(async () => undefined),
  deleteExpense: jest.fn(async () => undefined),
  restoreExpense: jest.fn(async () => ({})),
  appendSplitHistoryEntry: jest.fn(async () => undefined),
  touchAllTravelers: jest.fn(async () => {}),
}));

const mmkvStore: Record<string, unknown> = {};
jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: { OFFLINE_QUEUE: "offlineQueue" },
  getMMKVObject: jest.fn((key: string) => mmkvStore[key] ?? null),
  setMMKVObject: jest.fn((key: string, value: unknown) => {
    mmkvStore[key] = value;
  }),
}));

import { isConnectionFastEnough } from "../../util/connectionSpeed";
import {
  appendSplitHistoryEntry,
  deleteExpense,
  storeExpenseWithId,
  updateExpense,
} from "../../util/http";
import {
  deleteExpenseOnlineOffline,
  sendOfflineQueue,
  storeExpenseOnlineOffline,
  updateExpenseOnlineOffline,
  type OfflineQueueManageExpenseItem,
} from "../../util/offline-queue";
import type { SplitHistoryEntry } from "../../util/split-history";
import { makeExpense } from "../fixtures/expense";

const entry = (id: string): SplitHistoryEntry => ({
  id,
  kind: "added",
  description: "Dinner",
  byUid: "u1",
  byName: "Alice",
  timestamp: 1,
  tripCurrency: "EUR",
  balanceChanges: [
    { userName: "Alice", amount: 50 },
    { userName: "Bob", amount: -50 },
  ],
});

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(mmkvStore).forEach((k) => delete mmkvStore[k]);
  (isConnectionFastEnough as jest.Mock).mockResolvedValue({ isFastEnough: true });
});

describe("split history write path", () => {
  it("online: appends exactly one entry after the Expense is saved", async () => {
    const item: OfflineQueueManageExpenseItem = {
      type: "add",
      historyEntry: entry("h1"),
      expense: { tripid: "trip-1", uid: "u1", expenseData: makeExpense() },
    };

    await storeExpenseOnlineOffline(item, true);

    expect(storeExpenseWithId).toHaveBeenCalledTimes(1);
    expect(appendSplitHistoryEntry).toHaveBeenCalledTimes(1);
    expect(appendSplitHistoryEntry).toHaveBeenCalledWith("trip-1", entry("h1"));
  });

  it("online: update and delete each append their own entry", async () => {
    await updateExpenseOnlineOffline({
      type: "update",
      historyEntry: entry("h2"),
      expense: { tripid: "trip-1", uid: "u1", id: "e1", expenseData: makeExpense() },
    });
    await deleteExpenseOnlineOffline(
      {
        type: "delete",
        historyEntry: entry("h3"),
        expense: { tripid: "trip-1", uid: "u1", id: "e1" },
      },
      true
    );

    expect(updateExpense).toHaveBeenCalledTimes(1);
    expect(deleteExpense).toHaveBeenCalledTimes(1);
    expect((appendSplitHistoryEntry as jest.Mock).mock.calls.map((c) => c[1].id)).toEqual([
      "h2",
      "h3",
    ]);
  });

  it("offline: the entry waits in the queue and syncs with the Expense change, once", async () => {
    (isConnectionFastEnough as jest.Mock).mockResolvedValue({ isFastEnough: false });
    await storeExpenseOnlineOffline(
      {
        type: "add",
        historyEntry: entry("h4"),
        expense: { tripid: "trip-1", uid: "u1", expenseData: makeExpense() },
      },
      true
    );
    expect(appendSplitHistoryEntry).not.toHaveBeenCalled();

    (isConnectionFastEnough as jest.Mock).mockResolvedValue({ isFastEnough: true });
    await sendOfflineQueue(false, () => {});

    expect(storeExpenseWithId).toHaveBeenCalledTimes(1);
    expect(appendSplitHistoryEntry).toHaveBeenCalledTimes(1);
    expect(appendSplitHistoryEntry).toHaveBeenCalledWith("trip-1", entry("h4"));
  });

  it("an Expense change without a history entry appends nothing", async () => {
    await deleteExpenseOnlineOffline(
      { type: "delete", expense: { tripid: "trip-1", uid: "u1", id: "e1" } },
      true
    );
    expect(appendSplitHistoryEntry).not.toHaveBeenCalled();
  });

  it("a failed history write never fails the save: the Expense is written exactly once", async () => {
    (appendSplitHistoryEntry as jest.Mock).mockRejectedValue(new Error("Network Error"));

    await expect(
      storeExpenseOnlineOffline(
        {
          type: "add",
          historyEntry: entry("h5"),
          expense: { tripid: "trip-1", uid: "u1", expenseData: makeExpense() },
        },
        true
      )
    ).resolves.toBeDefined();
    await updateExpenseOnlineOffline({
      type: "update",
      historyEntry: entry("h6"),
      expense: { tripid: "trip-1", uid: "u1", id: "e1", expenseData: makeExpense() },
    });

    expect(storeExpenseWithId).toHaveBeenCalledTimes(1);
    expect(updateExpense).toHaveBeenCalledTimes(1);
    expect(mmkvStore["offlineQueue"] ?? []).toEqual([]);
  });

  it("a failed history write does not keep an applied item in the queue", async () => {
    (isConnectionFastEnough as jest.Mock).mockResolvedValue({ isFastEnough: false });
    await storeExpenseOnlineOffline(
      {
        type: "add",
        historyEntry: entry("h7"),
        expense: { tripid: "trip-1", uid: "u1", expenseData: makeExpense() },
      },
      true
    );
    (isConnectionFastEnough as jest.Mock).mockResolvedValue({ isFastEnough: true });
    (appendSplitHistoryEntry as jest.Mock).mockRejectedValue(new Error("500"));

    await sendOfflineQueue(false, () => {});

    expect(storeExpenseWithId).toHaveBeenCalledTimes(1);
    expect(mmkvStore["offlineQueue"] ?? []).toEqual([]);
  });
});
