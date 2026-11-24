/**
 * Token retrieval for the signed-in Traveller: a valid token is reused, an
 * expired token is refreshed once, a failed refresh falls back to password
 * sign-in, and concurrent callers of the same account share a single
 * in-flight refresh or sign-in. A refresh that is still pending when the
 * account changes must never reach the next account.
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
  // When set, the next refresh request waits on this gate before answering.
  refreshGate: Promise<void> | null;
};

const mockFakeAuth: FakeAuth = {
  refreshStatus: 200,
  signInStatus: 200,
  refreshGate: null,
};
let mockRefreshCalls = 0;
let mockSignInCalls = 0;

jest.mock("axios", () => {
  const post = jest.fn(async (url: string, body: Record<string, string>) => {
    if (url.startsWith("https://securetoken.googleapis.com/v1/token")) {
      mockRefreshCalls += 1;
      const gate = mockFakeAuth.refreshGate;
      mockFakeAuth.refreshGate = null;
      if (gate) {
        await gate;
      }
      if (mockFakeAuth.refreshStatus !== 200) {
        throw Object.assign(new Error("Request failed with status code 403"), {
          response: {
            status: mockFakeAuth.refreshStatus,
            data: { error: { message: "PERMISSION_DENIED" } },
          },
        });
      }
      // Echo the refresh token it was given, so each answer names its account.
      return {
        data: {
          access_token: `access-for-${body.refresh_token}`,
          refresh_token: `${body.refresh_token}-rotated`,
          expires_in: "3600",
        },
      };
    }
    if (url.startsWith("https://identitytoolkit.googleapis.com/")) {
      mockSignInCalls += 1;
      if (mockFakeAuth.signInStatus !== 200) {
        throw Object.assign(new Error("Request failed with status code 400"), {
          response: { status: mockFakeAuth.signInStatus, data: {} },
        });
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
  const instance = { post, defaults: { headers: { common: {} } } };
  return { __esModule: true, default: instance, ...instance };
});

import { getValidIdToken, storeAuthData } from "../../util/firebase-auth";

const HOUR_MS = 60 * 60 * 1000;

function signedInWithExpiry(expiresAt: number) {
  secureStore.token = "stale-token";
  secureStore.tokenExpiry = String(expiresAt);
  secureStore.refreshToken = "stored-refresh";
  secureStore.ENCM = "traveller@example.com";
  secureStore.ENCP = "stored-password";
}

/** Signs in a second account whose token is already expired. */
function switchToAccountB() {
  return storeAuthData({
    idToken: "b-stale-token",
    refreshToken: "b-refresh",
    expiresIn: "0",
    localId: "uid-b",
  });
}

/** Lets every pending step that does not wait on a gate run to completion. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("getValidIdToken", () => {
  beforeEach(() => {
    Object.keys(secureStore).forEach((key) => delete secureStore[key]);
    mockFakeAuth.refreshStatus = 200;
    mockFakeAuth.signInStatus = 200;
    mockFakeAuth.refreshGate = null;
    mockRefreshCalls = 0;
    mockSignInCalls = 0;
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

    expect(await getValidIdToken()).toBe("access-for-stored-refresh");
    expect(mockRefreshCalls).toBe(1);
    expect(mockSignInCalls).toBe(0);
    expect(secureStore.token).toBe("access-for-stored-refresh");
    expect(secureStore.refreshToken).toBe("stored-refresh-rotated");
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
    expect(tokens.every((t) => t === "access-for-stored-refresh")).toBe(true);
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
    expect(await getValidIdToken()).toBe("access-for-stored-refresh");
    expect(mockRefreshCalls).toBe(2);
  });

  it("does not hand account A's pending refresh to account B and does not overwrite B's credentials", async () => {
    signedInWithExpiry(Date.now() - 1000);
    let releaseA!: () => void;
    mockFakeAuth.refreshGate = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    const aPending = getValidIdToken();
    await settle();

    await switchToAccountB();
    const bPending = getValidIdToken();
    await settle();

    releaseA();
    const [aToken, bToken] = await Promise.all([aPending, bPending]);

    expect(bToken).toBe("access-for-b-refresh");
    expect(aToken).toBeNull();
    expect(secureStore.token).toBe("access-for-b-refresh");
    expect(secureStore.refreshToken).toBe("b-refresh-rotated");
  });

  it("lets 30 callers of account B share B's own refresh, not account A's pending one", async () => {
    signedInWithExpiry(Date.now() - 1000);
    let releaseA!: () => void;
    mockFakeAuth.refreshGate = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    const aCalls = Array.from({ length: 30 }, () => getValidIdToken());
    await settle();

    await switchToAccountB();
    const bCalls = Array.from({ length: 30 }, () => getValidIdToken());
    await settle();

    releaseA();
    const bTokens = await Promise.all(bCalls);
    const aTokens = await Promise.all(aCalls);

    expect(bTokens.every((t) => t === "access-for-b-refresh")).toBe(true);
    expect(aTokens.every((t) => t === null)).toBe(true);
    expect(mockRefreshCalls).toBe(2);
    expect(secureStore.token).toBe("access-for-b-refresh");
  });
});
