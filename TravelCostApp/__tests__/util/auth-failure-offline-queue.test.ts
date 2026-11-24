/**
 * Auth failures never silently drop Expenses (#424).
 *
 * With no valid ID token, a new Expense is queued instead of lost, and the
 * queue uploads it once a token is available again. With no token and no
 * stored credentials, the Traveller is routed to the login screen.
 *
 * Real http.tsx and offline-queue.ts run against a fake RTDB behind axios.
 */
const secureStore: Record<string, string> = {};

jest.mock("../../store/secure-storage", () => ({
  secureStoreSetItem: jest.fn(async (key: string, value: string) => {
    secureStore[key] = value;
  }),
  secureStoreGetItem: jest.fn(async (key: string) => secureStore[key] ?? ""),
  secureStoreRemoveItem: jest.fn(async (key: string) => {
    delete secureStore[key];
  }),
}));

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
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(async () => ({ isConnected: true })),
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

jest.mock("../../util/active-trip-id", () => ({
  getActiveTripId: jest.fn(async () => "trip-1"),
}));

jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => ({ isFastEnough: true })),
}));

let mockRtdbWrites: { method: string; url: string }[] = [];

jest.mock("axios", () => {
  const put = jest.fn(async (url: string, body: unknown) => {
    mockRtdbWrites.push({ method: "put", url });
    return { data: body };
  });
  const patch = jest.fn(async (url: string, body: unknown) => {
    mockRtdbWrites.push({ method: "patch", url });
    return { data: body };
  });
  const post = jest.fn(async (url: string) => {
    throw new Error(`Unexpected POST in test: ${url}`);
  });
  const instance: any = {
    put,
    patch,
    post,
    get: jest.fn(async () => ({ data: null })),
    delete: jest.fn(async () => ({ data: null })),
    defaults: { headers: { common: {} }, timeout: 0 },
    interceptors: { request: { use: () => 0 }, response: { use: () => 0 } },
  };
  return { __esModule: true, default: instance, ...instance };
});

import { makeExpense } from "../fixtures/expense";
import { MMKV_KEYS } from "../../store/mmkv";
import { setAuthLostHandler } from "../../util/auth-failure";
import {
  storeExpenseOnlineOffline,
  updateExpenseOnlineOffline,
  sendOfflineQueue,
} from "../../util/offline-queue";

const HOUR_MS = 60 * 60 * 1000;

function signedOut() {
  // Refresh token still stored, but no ID token currently available.
  secureStore.refreshToken = "stored-refresh";
  secureStore.ENCM = "traveller@example.com";
  secureStore.ENCP = "stored-password";
}

function tokenAvailable(token: string) {
  secureStore.token = token;
  secureStore.tokenExpiry = String(Date.now() + HOUR_MS);
}

const queue = () => (mmkvStore[MMKV_KEYS.OFFLINE_QUEUE] as any[]) ?? [];

describe("Auth failures never silently drop Expenses (#424)", () => {
  beforeEach(() => {
    Object.keys(secureStore).forEach((key) => delete secureStore[key]);
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
    mockRtdbWrites = [];
    setAuthLostHandler(null);
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("queues a new Expense when the token is missing and syncs it once a token is available", async () => {
    signedOut();
    const expense = makeExpense({ id: "local-exp-1", uid: "uid-1" });

    await storeExpenseOnlineOffline(
      { type: "add", expense: { tripid: "trip-1", uid: "uid-1", id: "local-exp-1", expenseData: expense } } as any,
      true,
      "trip-1"
    );

    expect(mockRtdbWrites).toHaveLength(0);
    expect(queue()).toHaveLength(1);
    expect(queue()[0].type).toBe("add");
    expect(queue()[0].expense.id).toBe("local-exp-1");

    tokenAvailable("fresh-token");
    await sendOfflineQueue(false, jest.fn());

    expect(mockRtdbWrites).toHaveLength(1);
    expect(mockRtdbWrites[0].method).toBe("put");
    expect(mockRtdbWrites[0].url).toContain("/trips/trip-1/uid-1/expenses/local-exp-1.json");
    expect(mockRtdbWrites[0].url).toContain("auth=fresh-token");
    expect(queue()).toEqual([]);
  });

  it("keeps a queued update when the token is still missing during a sync attempt", async () => {
    signedOut();
    const expense = makeExpense({ id: "exp-2", uid: "uid-1" });

    await updateExpenseOnlineOffline(
      { type: "update", expense: { tripid: "trip-1", uid: "uid-1", id: "exp-2", expenseData: expense } } as any,
      true
    );
    expect(queue()).toHaveLength(1);

    await sendOfflineQueue(false, jest.fn());

    expect(mockRtdbWrites).toHaveLength(0);
    expect(queue()).toHaveLength(1);
  });

  it("routes the Traveller to the login screen when there is no token and no stored credentials", async () => {
    const onAuthLost = jest.fn();
    setAuthLostHandler(onAuthLost);
    const expense = makeExpense({ id: "exp-3", uid: "uid-1" });

    await storeExpenseOnlineOffline(
      { type: "add", expense: { tripid: "trip-1", uid: "uid-1", expenseData: expense } } as any,
      true,
      "trip-1"
    );

    expect(onAuthLost).toHaveBeenCalledTimes(1);
    expect(queue()).toHaveLength(1);
  });

  it("does not route to login while stored credentials remain", async () => {
    const onAuthLost = jest.fn();
    setAuthLostHandler(onAuthLost);
    signedOut();
    const expense = makeExpense({ id: "exp-4", uid: "uid-1" });

    await storeExpenseOnlineOffline(
      { type: "add", expense: { tripid: "trip-1", uid: "uid-1", expenseData: expense } } as any,
      true,
      "trip-1"
    );

    expect(onAuthLost).not.toHaveBeenCalled();
  });
});
