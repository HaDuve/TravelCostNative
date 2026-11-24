/**
 * A request rejected with 401/403 gets exactly one token refresh and one retry.
 * A second rejection surfaces as an AuthFailure (tagged in the log) instead of
 * looping or crashing.
 *
 * The network boundary is a fake RTDB and a fake token endpoint behind axios.
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

jest.mock("../../store/mmkv", () => ({
  getMMKVString: jest.fn(),
  setMMKVString: jest.fn(),
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
}));

let mockRefreshCalls = 0;
let mockRtdbPut: (url: string, body: unknown) => Promise<unknown> = async () => ({
  data: {},
});

jest.mock("axios", () => {
  const post = jest.fn(async (url: string) => {
    if (url.startsWith("https://securetoken.googleapis.com/v1/token")) {
      mockRefreshCalls += 1;
      return {
        data: {
          access_token: `refreshed-token-${mockRefreshCalls}`,
          refresh_token: "rotated-refresh",
          expires_in: "3600",
        },
      };
    }
    throw new Error(`Unexpected POST in test: ${url}`);
  });
  const put = jest.fn((url: string, body: unknown) => mockRtdbPut(url, body));
  const instance: any = {
    post,
    put,
    get: jest.fn(async () => ({ data: null })),
    patch: jest.fn(async () => ({ data: {} })),
    delete: jest.fn(async () => ({ data: null })),
    defaults: { headers: { common: {} }, timeout: 0 },
    interceptors: { request: { use: () => 0 }, response: { use: () => 0 } },
  };
  return { __esModule: true, default: instance, ...instance };
});

import { makeExpense } from "../fixtures/expense";
import { AuthFailureError } from "../../util/auth-failure";
import { storeExpenseWithId } from "../../util/http";

const HOUR_MS = 60 * 60 * 1000;

function httpError(status: number) {
  const err: any = new Error(`Request failed with status code ${status}`);
  err.response = { status, data: { error: "Permission denied" } };
  return err;
}

function signedIn(token: string) {
  secureStore.token = token;
  secureStore.tokenExpiry = String(Date.now() + HOUR_MS);
  secureStore.refreshToken = "stored-refresh";
  secureStore.ENCM = "traveller@example.com";
  secureStore.ENCP = "stored-password";
}

describe("RTDB write rejected with 401/403", () => {
  let putUrls: string[];

  beforeEach(() => {
    Object.keys(secureStore).forEach((key) => delete secureStore[key]);
    mockRefreshCalls = 0;
    putUrls = [];
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([401, 403])(
    "refreshes once and retries once with the new token after a %i",
    async (status) => {
      signedIn("stale-token");
      mockRtdbPut = async (url) => {
        putUrls.push(url);
        if (putUrls.length === 1) throw httpError(status);
        return { data: {} };
      };

      await expect(
        storeExpenseWithId("trip-1", "uid-1", "exp-1", makeExpense({ id: "exp-1" }))
      ).resolves.toBe("exp-1");

      expect(mockRefreshCalls).toBe(1);
      expect(putUrls).toHaveLength(2);
      expect(putUrls[0]).toContain("auth=stale-token");
      expect(putUrls[1]).toContain("auth=refreshed-token-1");
    }
  );

  it("surfaces a second rejection as a tagged auth failure without another refresh", async () => {
    signedIn("stale-token");
    mockRtdbPut = async (url) => {
      putUrls.push(url);
      throw httpError(401);
    };

    const error = await storeExpenseWithId(
      "trip-1",
      "uid-1",
      "exp-1",
      makeExpense({ id: "exp-1" })
    ).then(
      () => null,
      (e: unknown) => e
    );

    expect(error).toBeInstanceOf(AuthFailureError);
    expect(mockRefreshCalls).toBe(1);
    expect(putUrls).toHaveLength(2);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[AUTH-FAILURE]")
    );
  });

  it("does not retry a non-auth failure", async () => {
    signedIn("valid-token");
    secureStore.tokenExpiry = String(Date.now() + HOUR_MS);
    mockRtdbPut = async (url) => {
      putUrls.push(url);
      throw new Error("timeout");
    };

    await expect(
      storeExpenseWithId("trip-1", "uid-1", "exp-1", makeExpense({ id: "exp-1" }))
    ).rejects.toThrow("timeout");
    expect(mockRefreshCalls).toBe(0);
    expect(putUrls).toHaveLength(1);
  });
});
