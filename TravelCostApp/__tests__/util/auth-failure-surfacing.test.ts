/**
 * Auth failures on Expense reads are reported, never shown as an empty ledger:
 * fetchExpenses throws AuthFailureError, a multi-Traveller fetch stops at the
 * first auth failure, retries do not repeat an auth failure, and the
 * RecentExpenses refresh tells the Traveller.
 */
const secureStore: Record<string, string> = {};

jest.mock("../../store/secure-storage", () => ({
  secureStoreSetItem: jest.fn(async (key: string, value: string) => {
    secureStore[key] = value;
  }),
  secureStoreGetItem: jest.fn(async (key: string) => secureStore[key] ?? ""),
  secureStoreRemoveItem: jest.fn(),
}));

jest.mock("../../store/mmkv", () => ({
  getMMKVString: jest.fn(),
  setMMKVString: jest.fn(),
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("axios", () => {
  const instance: any = {
    post: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    defaults: { headers: { common: {} }, timeout: 0 },
    interceptors: { request: { use: () => 0 }, response: { use: () => 0 } },
  };
  return { __esModule: true, default: instance, ...instance };
});

import axios from "axios";
import Toast from "react-native-toast-message";
import { AuthFailureError } from "../../util/auth-failure";
import { invalidateAuthSession } from "../../util/firebase-auth";
import { fetchExpenses, getAllExpenses } from "../../util/http";
import { withRetries } from "../../util/sync-with-retries";
import { fetchAndSetExpenses } from "../../components/ExpensesOutput/RecentExpensesUtil";

const mockedAxios = axios as jest.Mocked<typeof axios>;
const HOUR_MS = 60 * 60 * 1000;

function rejected(status: number) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data: { error: "Permission denied" } },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  invalidateAuthSession();
  Object.keys(secureStore).forEach((key) => delete secureStore[key]);
});

function signedIn() {
  secureStore.token = "valid-token";
  secureStore.tokenExpiry = String(Date.now() + HOUR_MS);
  secureStore.refreshToken = "stored-refresh";
}

describe("fetchExpenses", () => {
  it("throws AuthFailureError without a token instead of returning an empty list", async () => {
    await expect(fetchExpenses("trip-1", "uid-1", false)).rejects.toBeInstanceOf(
      AuthFailureError
    );
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it("throws AuthFailureError when RTDB keeps rejecting after a refresh", async () => {
    signedIn();
    mockedAxios.get.mockRejectedValue(rejected(401));
    mockedAxios.post.mockResolvedValue({
      data: { access_token: "fresh", refresh_token: "r", expires_in: "3600" },
    });

    await expect(fetchExpenses("trip-1", "uid-1", false)).rejects.toBeInstanceOf(
      AuthFailureError
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("still returns an empty list for a non-auth error", async () => {
    signedIn();
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));
    await expect(fetchExpenses("trip-1", "uid-1", false)).resolves.toEqual([]);
  });
});

describe("fetching every Traveller's Expenses", () => {
  it("stops at the first auth failure", async () => {
    signedIn();
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.includes("/travellers.json")) {
        return {
          data: {
            a: { uid: "uid-a", userName: "A" },
            b: { uid: "uid-b", userName: "B" },
            c: { uid: "uid-c", userName: "C" },
          },
        };
      }
      throw rejected(403);
    });
    mockedAxios.post.mockRejectedValue(new Error("Network Error"));

    await expect(getAllExpenses("trip-1", "uid-a", false)).rejects.toBeInstanceOf(
      AuthFailureError
    );

    const expenseGets = mockedAxios.get.mock.calls.filter(([url]) =>
      String(url).includes("/expenses.json")
    );
    expect(expenseGets.every(([url]) => String(url).includes("/uid-a/"))).toBe(true);
  });
});

describe("withRetries", () => {
  it("rethrows an auth failure without retrying", async () => {
    const attempt = jest.fn(async () => {
      throw new AuthFailureError("storeExpense");
    });
    await expect(withRetries(attempt, { delaysMs: [0] })).rejects.toBeInstanceOf(
      AuthFailureError
    );
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("still retries other errors", async () => {
    const attempt = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce("ok");
    await expect(withRetries(attempt, { delaysMs: [0] })).resolves.toBe("ok");
    expect(attempt).toHaveBeenCalledTimes(2);
  });
});

describe("RecentExpenses refresh", () => {
  it("tells the Traveller when the sync fails on auth", async () => {
    // No token: every request is an auth failure.
    mockedAxios.get.mockResolvedValue({ data: null });
    const expensesCtx: any = {
      setIsSyncing: jest.fn(),
      mergeExpenses: jest.fn(),
    };

    await fetchAndSetExpenses(
      false,
      true,
      jest.fn(),
      jest.fn(),
      expensesCtx,
      "trip-1",
      "uid-1"
    );

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
    expect(expensesCtx.mergeExpenses).not.toHaveBeenCalled();
    expect(expensesCtx.setIsSyncing).toHaveBeenLastCalledWith(false);
  });
});
