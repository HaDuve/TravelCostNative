/**
 * Token retrieval for the signed-in Traveller: a valid token is reused, an
 * expired token is refreshed once, a failed refresh falls back to password
 * sign-in, and concurrent callers share a single in-flight refresh or sign-in.
 *
 * The network boundary is a fake auth endpoint behind axios.post.
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
}));

type FakeAuth = {
  refreshStatus: number;
  signInStatus: number;
};

const mockFakeAuth: FakeAuth = { refreshStatus: 200, signInStatus: 200 };
let mockRefreshCalls = 0;
let mockSignInCalls = 0;
let mockRefreshSeq = 0;

jest.mock("axios", () => {
  const post = jest.fn(async (url: string, _body: unknown) => {
    if (url.startsWith("https://securetoken.googleapis.com/v1/token")) {
      mockRefreshCalls += 1;
      if (mockFakeAuth.refreshStatus !== 200) {
        const err: any = new Error("Request failed with status code 403");
        err.response = {
          status: mockFakeAuth.refreshStatus,
          data: { error: { message: "PERMISSION_DENIED" } },
        };
        throw err;
      }
      mockRefreshSeq += 1;
      return {
        data: {
          access_token: `refreshed-token-${mockRefreshSeq}`,
          refresh_token: "rotated-refresh",
          expires_in: "3600",
        },
      };
    }
    if (url.startsWith("https://identitytoolkit.googleapis.com/")) {
      mockSignInCalls += 1;
      if (mockFakeAuth.signInStatus !== 200) {
        const err: any = new Error("Request failed with status code 400");
        err.response = { status: mockFakeAuth.signInStatus, data: {} };
        throw err;
      }
      return {
        data: {
          idToken: "password-token",
          refreshToken: "password-refresh",
          expiresIn: "3600",
          localId: "uid-1",
        },
      };
    }
    throw new Error(`Unexpected URL in fake auth: ${url}`);
  });
  const instance: any = { post, defaults: { headers: { common: {} } } };
  return { __esModule: true, default: instance, ...instance };
});

import { getValidIdToken } from "../../util/firebase-auth";

const HOUR_MS = 60 * 60 * 1000;

function signedInWithExpiry(expiresAt: number) {
  secureStore.token = "stale-token";
  secureStore.tokenExpiry = String(expiresAt);
  secureStore.refreshToken = "stored-refresh";
  secureStore.ENCM = "traveller@example.com";
  secureStore.ENCP = "stored-password";
}

describe("getValidIdToken", () => {
  beforeEach(() => {
    Object.keys(secureStore).forEach((key) => delete secureStore[key]);
    mockFakeAuth.refreshStatus = 200;
    mockFakeAuth.signInStatus = 200;
    mockRefreshCalls = 0;
    mockSignInCalls = 0;
    mockRefreshSeq = 0;
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the stored token without any network call while it is valid", async () => {
    signedInWithExpiry(Date.now() + HOUR_MS);
    secureStore.token = "valid-token";

    expect(await getValidIdToken()).toBe("valid-token");
    expect(mockRefreshCalls).toBe(0);
    expect(mockSignInCalls).toBe(0);
  });

  it("refreshes an expired token with the stored refresh token", async () => {
    signedInWithExpiry(Date.now() - 1000);

    expect(await getValidIdToken()).toBe("refreshed-token-1");
    expect(mockRefreshCalls).toBe(1);
    expect(mockSignInCalls).toBe(0);
    expect(secureStore.token).toBe("refreshed-token-1");
    expect(secureStore.refreshToken).toBe("rotated-refresh");
  });

  it("falls back to password sign-in when the refresh is denied", async () => {
    signedInWithExpiry(Date.now() - 1000);
    mockFakeAuth.refreshStatus = 403;

    expect(await getValidIdToken()).toBe("password-token");
    expect(mockRefreshCalls).toBe(1);
    expect(mockSignInCalls).toBe(1);
    expect(secureStore.token).toBe("password-token");
  });

  it("returns null when both refresh and password sign-in fail", async () => {
    signedInWithExpiry(Date.now() - 1000);
    mockFakeAuth.refreshStatus = 403;
    mockFakeAuth.signInStatus = 400;

    expect(await getValidIdToken()).toBeNull();
    expect(mockRefreshCalls).toBe(1);
    expect(mockSignInCalls).toBe(1);
  });

  it("lets 30 concurrent callers with an expired token share one refresh", async () => {
    signedInWithExpiry(Date.now() - 1000);

    const tokens = await Promise.all(
      Array.from({ length: 30 }, () => getValidIdToken())
    );

    expect(mockRefreshCalls).toBe(1);
    expect(mockSignInCalls).toBe(0);
    expect(tokens).toHaveLength(30);
    expect(tokens.every((t) => t === "refreshed-token-1")).toBe(true);
  });

  it("lets concurrent callers share one password sign-in after a failed refresh", async () => {
    signedInWithExpiry(Date.now() - 1000);
    mockFakeAuth.refreshStatus = 403;

    const tokens = await Promise.all(
      Array.from({ length: 30 }, () => getValidIdToken())
    );

    expect(mockRefreshCalls).toBe(1);
    expect(mockSignInCalls).toBe(1);
    expect(tokens.every((t) => t === "password-token")).toBe(true);
  });

  it("starts a new refresh for a later call once the previous one has settled", async () => {
    signedInWithExpiry(Date.now() - 1000);
    await getValidIdToken();

    signedInWithExpiry(Date.now() - 1000);
    expect(await getValidIdToken()).toBe("refreshed-token-2");
    expect(mockRefreshCalls).toBe(2);
  });
});
