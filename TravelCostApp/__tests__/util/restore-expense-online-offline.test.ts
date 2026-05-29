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

jest.mock("../../util/http", () => ({
  restoreExpense: jest.fn(async () => ({})),
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

import { MMKV_KEYS } from "../../store/mmkv";
import { restoreExpense } from "../../util/http";
import { restoreExpenseOnlineOffline } from "../../util/offline-queue";

describe("restoreExpenseOnlineOffline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
  });

  it("removes a pending queued delete instead of calling the server", async () => {
    mmkvStore[MMKV_KEYS.OFFLINE_QUEUE] = [
      {
        type: "delete",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-1" },
      },
      {
        type: "update",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-2" },
      },
    ];

    await restoreExpenseOnlineOffline(
      {
        type: "restore",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-1" },
      },
      true,
    );

    expect(restoreExpense).not.toHaveBeenCalled();
    expect(mmkvStore[MMKV_KEYS.OFFLINE_QUEUE]).toEqual([
      {
        type: "update",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-2" },
      },
    ]);
  });

  it("PATCHes restore on the server when online with no pending queued delete", async () => {
    await restoreExpenseOnlineOffline(
      {
        type: "restore",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-9" },
      },
      true,
    );

    expect(restoreExpense).toHaveBeenCalledWith("trip-1", "u1", "exp-9");
    expect(mmkvStore[MMKV_KEYS.OFFLINE_QUEUE] ?? []).toEqual([]);
  });

  it("queues restore when the connection is not fast enough", async () => {
    const { isConnectionFastEnough } = require("../../util/connectionSpeed");
    (isConnectionFastEnough as jest.Mock).mockResolvedValueOnce({
      isFastEnough: false,
    });

    await restoreExpenseOnlineOffline(
      {
        type: "restore",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-slow" },
      },
      true,
    );

    expect(restoreExpense).not.toHaveBeenCalled();
    expect(mmkvStore[MMKV_KEYS.OFFLINE_QUEUE]).toEqual([
      {
        type: "restore",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-slow" },
      },
    ]);
  });

  it("queues restore when the PATCH returns no response", async () => {
    (restoreExpense as jest.Mock).mockResolvedValueOnce(null);

    await restoreExpenseOnlineOffline(
      {
        type: "restore",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-failed" },
      },
      true,
    );

    expect(mmkvStore[MMKV_KEYS.OFFLINE_QUEUE]).toEqual([
      {
        type: "restore",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-failed" },
      },
    ]);
  });
});
