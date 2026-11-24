/**
 * When the stored credentials are definitively rejected (the Token Service or
 * Identity Toolkit answers 400/401, e.g. INVALID_REFRESH_TOKEN,
 * INVALID_PASSWORD, USER_DISABLED), the Traveller is sent to the login screen.
 * Network errors, 403 (API key misconfiguration) and rate limits are not a
 * verdict on the credentials and must not log anyone out.
 *
 * The network boundary is a fake token endpoint, a fake sign-in endpoint and a
 * fake RTDB behind axios.
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

type FakeAnswer = { status: number; message?: string } | "network-error";

const mockAuth: { refresh: FakeAnswer; signIn: FakeAnswer } = {
  refresh: { status: 200 },
  signIn: { status: 200 },
};

function mockAnswer(answer: FakeAnswer, data: unknown) {
  if (answer === "network-error") {
    throw new Error("Network Error");
  }
  if (answer.status !== 200) {
    throw Object.assign(
      new Error(`Request failed with status code ${answer.status}`),
      {
        response: {
          status: answer.status,
          data: { error: { message: answer.message ?? "" } },
        },
      }
    );
  }
  return { data };
}

jest.mock("axios", () => {
  const post = jest.fn(async (url: string) => {
    if (url.startsWith("https://securetoken.googleapis.com/v1/token")) {
      return mockAnswer(mockAuth.refresh, {
        access_token: "refreshed-token",
        refresh_token: "rotated-refresh",
        expires_in: "3600",
      });
    }
    if (url.includes("accounts:signInWithPassword")) {
      return mockAnswer(mockAuth.signIn, {
        idToken: "signed-in-token",
        refreshToken: "new-refresh",
        expiresIn: "3600",
        localId: "uid-1",
      });
    }
    throw new Error(`Unexpected POST in test: ${url}`);
  });
  const instance: any = {
    post,
    put: jest.fn(async () => ({ data: {} })),
    get: jest.fn(async () => ({ data: null })),
    patch: jest.fn(async () => ({ data: {} })),
    delete: jest.fn(async () => ({ data: null })),
    defaults: { headers: { common: {} }, timeout: 0 },
    interceptors: { request: { use: () => 0 }, response: { use: () => 0 } },
  };
  return { __esModule: true, default: instance, ...instance };
});

import { makeExpense } from "../fixtures/expense";
import {
  AuthFailureError,
  setAuthLostHandler,
} from "../../util/auth-failure";
import {
  hasStoredCredentials,
  invalidateAuthSession,
  isDefinitiveCredentialRejection,
  storeAuthData,
} from "../../util/firebase-auth";
import { storeExpenseWithId } from "../../util/http";

function signedInWithExpiredToken() {
  Object.keys(secureStore).forEach((key) => delete secureStore[key]);
  secureStore.token = "expired-token";
  secureStore.tokenExpiry = String(Date.now() - 1000);
  secureStore.refreshToken = "stored-refresh";
  secureStore.ENCM = "traveller@example.com";
  secureStore.ENCP = "stored-password";
}

async function attemptWrite() {
  return storeExpenseWithId("trip-1", "uid-1", "exp-1", makeExpense());
}

describe("stored credentials rejected", () => {
  let authLost: jest.Mock;

  beforeEach(() => {
    invalidateAuthSession();
    signedInWithExpiredToken();
    authLost = jest.fn();
    setAuthLostHandler(authLost);
  });

  afterEach(() => setAuthLostHandler(null));

  it.each([
    ["INVALID_REFRESH_TOKEN", "INVALID_PASSWORD"],
    ["TOKEN_EXPIRED", "INVALID_LOGIN_CREDENTIALS"],
    ["USER_DISABLED", "USER_DISABLED"],
    ["USER_NOT_FOUND", "EMAIL_NOT_FOUND"],
  ])(
    "refresh %s and sign-in %s route to login",
    async (refreshCode, signInCode) => {
      mockAuth.refresh = { status: 400, message: refreshCode };
      mockAuth.signIn = { status: 400, message: signInCode };

      await expect(attemptWrite()).rejects.toBeInstanceOf(AuthFailureError);

      expect(authLost).toHaveBeenCalledTimes(1);
      await expect(hasStoredCredentials()).resolves.toBe(false);
    }
  );

  it("a 401 from the token endpoint with no stored password routes to login", async () => {
    delete secureStore.ENCM;
    delete secureStore.ENCP;
    mockAuth.refresh = { status: 401, message: "UNAUTHENTICATED" };

    await expect(attemptWrite()).rejects.toBeInstanceOf(AuthFailureError);
    expect(authLost).toHaveBeenCalledTimes(1);
  });

  it.each<[string, FakeAnswer, FakeAnswer]>([
    ["both requests hit a network error", "network-error", "network-error"],
    [
      "refresh is rejected but sign-in hits a network error",
      { status: 400, message: "INVALID_REFRESH_TOKEN" },
      "network-error",
    ],
    [
      "the API key blocks the Token Service (403) and sign-in is down (503)",
      { status: 403, message: "PERMISSION_DENIED" },
      { status: 503 },
    ],
    [
      "sign-in is rate limited",
      { status: 400, message: "INVALID_REFRESH_TOKEN" },
      { status: 400, message: "TOO_MANY_ATTEMPTS_TRY_LATER : Try again later" },
    ],
  ])("%s: no login route", async (_label, refresh, signIn) => {
    mockAuth.refresh = refresh;
    mockAuth.signIn = signIn;

    await expect(attemptWrite()).rejects.toBeInstanceOf(AuthFailureError);

    expect(authLost).not.toHaveBeenCalled();
    await expect(hasStoredCredentials()).resolves.toBe(true);
  });

  it("a new sign-in makes the stored credentials count again", async () => {
    mockAuth.refresh = { status: 400, message: "INVALID_REFRESH_TOKEN" };
    mockAuth.signIn = { status: 400, message: "INVALID_PASSWORD" };
    await expect(attemptWrite()).rejects.toBeInstanceOf(AuthFailureError);
    await expect(hasStoredCredentials()).resolves.toBe(false);

    await storeAuthData({
      idToken: "fresh-token",
      refreshToken: "fresh-refresh",
      expiresIn: "3600",
      localId: "uid-1",
    });

    await expect(hasStoredCredentials()).resolves.toBe(true);
  });
});

describe("isDefinitiveCredentialRejection", () => {
  const withResponse = (status: number, message = "") => ({
    response: { status, data: { error: { message } } },
  });

  it("is true for 400 and 401 credential errors", () => {
    expect(isDefinitiveCredentialRejection(withResponse(400, "INVALID_REFRESH_TOKEN"))).toBe(true);
    expect(isDefinitiveCredentialRejection(withResponse(400, "INVALID_PASSWORD"))).toBe(true);
    expect(isDefinitiveCredentialRejection(withResponse(401))).toBe(true);
  });

  it("is false for network errors, 403, 5xx and rate limits", () => {
    expect(isDefinitiveCredentialRejection(new Error("Network Error"))).toBe(false);
    expect(isDefinitiveCredentialRejection(withResponse(403, "PERMISSION_DENIED"))).toBe(false);
    expect(isDefinitiveCredentialRejection(withResponse(500))).toBe(false);
    expect(
      isDefinitiveCredentialRejection(withResponse(400, "TOO_MANY_ATTEMPTS_TRY_LATER"))
    ).toBe(false);
  });
});
