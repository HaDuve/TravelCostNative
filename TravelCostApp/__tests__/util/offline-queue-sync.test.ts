jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(async () => ({ isConnected: true })),
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => ({ isFastEnough: true })),
}));

jest.mock("../../util/http", () => ({
  storeExpenseWithId: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  touchAllTravelers: jest.fn(async () => {}),
}));

import { MMKV_KEYS } from "../../store/mmkv";
import { makeExpense } from "../fixtures/expense";
import { sendOfflineQueue } from "../../util/offline-queue";
import { storeExpenseWithId } from "../../util/http";

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

describe("sendOfflineQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
  });

  it("uploads offline-created expenses with a stable client id and clears the queue", async () => {
    const clientId = "offline-client-id";
    const expenseData = makeExpense({
      id: clientId,
      editedTimestamp: 1_700_000_000_000,
    });

    mmkvStore[MMKV_KEYS.OFFLINE_QUEUE] = [
      {
        type: "add",
        expense: {
          tripid: "trip-1",
          uid: "traveller-1",
          expenseData,
        },
      },
    ];

    (storeExpenseWithId as jest.Mock).mockResolvedValue(clientId);

    const updateExpenseId = jest.fn();
    let mutex = false;
    const setMutex = jest.fn((value: boolean) => {
      mutex = value;
    });

    await sendOfflineQueue(mutex, setMutex, { updateExpenseId });

    expect(storeExpenseWithId).toHaveBeenCalledWith(
      "trip-1",
      "traveller-1",
      clientId,
      expect.objectContaining({ id: clientId })
    );
    expect(updateExpenseId).not.toHaveBeenCalled();
    expect(mmkvStore[MMKV_KEYS.OFFLINE_QUEUE]).toEqual([]);
  });

  it("remaps the local expense id when the server returns a different id", async () => {
    const clientId = "local-offline-id";
    const serverId = "server-generated-id";
    const expenseData = makeExpense({
      id: clientId,
      editedTimestamp: 1_700_000_000_000,
    });

    mmkvStore[MMKV_KEYS.OFFLINE_QUEUE] = [
      {
        type: "add",
        expense: {
          tripid: "trip-1",
          uid: "traveller-1",
          expenseData,
        },
      },
    ];

    (storeExpenseWithId as jest.Mock).mockResolvedValue(serverId);

    const updateExpenseId = jest.fn();
    let mutex = false;
    const setMutex = jest.fn((value: boolean) => {
      mutex = value;
    });

    await sendOfflineQueue(mutex, setMutex, { updateExpenseId });

    expect(storeExpenseWithId).toHaveBeenCalledWith(
      "trip-1",
      "traveller-1",
      clientId,
      expect.objectContaining({ id: clientId })
    );
    expect(updateExpenseId).toHaveBeenCalledWith(clientId, serverId);
    expect(mmkvStore[MMKV_KEYS.OFFLINE_QUEUE]).toEqual([]);
  });
});
