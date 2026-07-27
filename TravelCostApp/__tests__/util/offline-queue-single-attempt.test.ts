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
  storeExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));

import { MMKV_KEYS } from "../../store/mmkv";
import { storeExpenseWithId } from "../../util/http";
import { storeExpenseOnlineOffline } from "../../util/offline-queue";
import { makeExpense } from "../fixtures/expense";

describe("storeExpenseOnlineOffline (single-attempt path)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
  });

  it("queues after one online failure without retrying HTTP", async () => {
    (storeExpenseWithId as jest.Mock).mockRejectedValue(new Error("network"));

    const expenseData = makeExpense({ id: "client-id" });
    await storeExpenseOnlineOffline(
      {
        type: "add",
        expense: {
          tripid: "trip-1",
          uid: "u1",
          id: "client-id",
          expenseData,
        },
      },
      true,
    );

    expect(storeExpenseWithId).toHaveBeenCalledTimes(1);
    expect(mmkvStore[MMKV_KEYS.OFFLINE_QUEUE]).toHaveLength(1);
  });
});
