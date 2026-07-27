jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => ({ isFastEnough: true })),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => "trip-1"),
}));

const mmkvStore: Record<string, unknown> = {};

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: {
    OFFLINE_QUEUE: "offlineQueue",
  },
  getMMKVObject: jest.fn((key: string) => mmkvStore[key] ?? null),
  setMMKVObject: jest.fn((key: string, value: unknown) => {
    mmkvStore[key] = value;
  }),
}));

jest.mock("../../util/http", () => ({
  storeExpenseWithId: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));

import Toast from "react-native-toast-message";
import { MMKV_KEYS } from "../../store/mmkv";
import { storeExpenseWithId } from "../../util/http";
import {
  persistRangedExpenseAdd,
  persistRangedExpenseInPlaceEdit,
  persistRangedExpenseReplace,
} from "../../util/ranged-expense-persist";
import { makeExpense } from "../fixtures/expense";
import { collectUserDeleteTargets } from "../../util/user-delete-expense";
import type { ExpenseData } from "../../util/expense";

function makeRangedInstances(): ExpenseData[] {
  const rangeId = "range-1";
  return [
    makeExpense({
      id: "",
      rangeId,
      date: new Date("2026-01-15T12:00:00.000Z"),
      startDate: new Date("2026-01-15T12:00:00.000Z"),
      endDate: new Date("2026-01-17T12:00:00.000Z"),
      amount: 30,
      calcAmount: 30,
    }),
    makeExpense({
      id: "",
      rangeId,
      date: new Date("2026-01-16T12:00:00.000Z"),
      startDate: new Date("2026-01-15T12:00:00.000Z"),
      endDate: new Date("2026-01-17T12:00:00.000Z"),
      amount: 30,
      calcAmount: 30,
    }),
    makeExpense({
      id: "",
      rangeId,
      date: new Date("2026-01-17T12:00:00.000Z"),
      startDate: new Date("2026-01-15T12:00:00.000Z"),
      endDate: new Date("2026-01-17T12:00:00.000Z"),
      amount: 30,
      calcAmount: 30,
    }),
  ];
}

describe("persistRangedExpenseAdd", () => {
  const expenseCtx = {
    addExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    updateExpenseId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
    (storeExpenseWithId as jest.Mock).mockResolvedValue(undefined);
  });

  it("adds every ranged day to the ledger immediately without a loading toast", async () => {
    const instances = makeRangedInstances();
    const { syncPromise } = persistRangedExpenseAdd(instances, {
      tripid: "trip-1",
      uid: "u1",
      isOnline: true,
      expenseCtx,
    });

    expect(expenseCtx.addExpense).toHaveBeenCalledTimes(3);
    const loadingToast = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "loading",
    );
    expect(loadingToast).toBeUndefined();

    await syncPromise;
  });

  it("retries online store 3 times then queues without reverting the ledger", async () => {
    jest.useFakeTimers();
    (storeExpenseWithId as jest.Mock).mockRejectedValue(new Error("network"));

    const instances = makeRangedInstances().slice(0, 1);
    const { syncPromise } = persistRangedExpenseAdd(instances, {
      tripid: "trip-1",
      uid: "u1",
      isOnline: true,
      expenseCtx,
    });

    const sync = syncPromise.catch(() => {});
    await jest.runAllTimersAsync();
    await sync;

    expect(storeExpenseWithId).toHaveBeenCalledTimes(3);
    const queue = mmkvStore[MMKV_KEYS.OFFLINE_QUEUE] as unknown[];
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: "add" });
    expect(expenseCtx.addExpense).toHaveBeenCalledTimes(1);
    expect(expenseCtx.deleteExpense).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});

describe("persistRangedExpenseInPlaceEdit", () => {
  const expenseCtx = {
    addExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    updateExpenseId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
  });

  it("updates every ranged day in the ledger immediately without a loading toast", () => {
    const updates = [
      {
        id: "day-1",
        expenseData: makeExpense({ id: "day-1", description: "rent jan 15" }),
      },
      {
        id: "day-2",
        expenseData: makeExpense({ id: "day-2", description: "rent jan 16" }),
      },
    ];

    const { syncPromise } = persistRangedExpenseInPlaceEdit(updates, {
      tripid: "trip-1",
      uid: "u1",
      isOnline: true,
      expenseCtx,
    });

    expect(expenseCtx.updateExpense).toHaveBeenCalledTimes(2);
    expect(expenseCtx.updateExpense).toHaveBeenCalledWith(
      "day-1",
      updates[0].expenseData,
    );
    const loadingToast = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "loading",
    );
    expect(loadingToast).toBeUndefined();

    return syncPromise;
  });
});

describe("persistRangedExpenseReplace", () => {
  const expenseCtx = {
    addExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    updateExpenseId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
    (storeExpenseWithId as jest.Mock).mockResolvedValue(undefined);
  });

  it("soft-deletes the old range and adds new days immediately without a loading toast", async () => {
    const oldExpenses = [
      makeExpense({ id: "old-1", rangeId: "range-1" }),
      makeExpense({ id: "old-2", rangeId: "range-1" }),
    ];
    const deleteTargets = collectUserDeleteTargets("trip-1", oldExpenses, [
      "old-1",
    ]);
    const newInstances = makeRangedInstances();

    const { syncPromise } = persistRangedExpenseReplace(
      deleteTargets,
      newInstances,
      {
        tripid: "trip-1",
        uid: "u1",
        isOnline: true,
        expenseCtx,
      },
    );

    expect(expenseCtx.deleteExpense).toHaveBeenCalledTimes(2);
    expect(expenseCtx.addExpense).toHaveBeenCalledTimes(3);
    const loadingToast = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "loading",
    );
    expect(loadingToast).toBeUndefined();

    await syncPromise;
  });
});
