/**
 * Signup must clear stale local cache before auth, not after — asyncStoreSafeClear
 * removes the Firebase token from secure storage.
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

jest.mock("@react-native-async-storage/async-storage", () => ({
  getAllKeys: jest.fn(async () => []),
  multiRemove: jest.fn(async () => {}),
}));

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: { CURRENT_TRIP: "currentTrip", EXPENSES: "expenses" },
  deleteMMKVObject: jest.fn(),
}));

import { asyncStoreSafeClear } from "../../store/async-storage";
import { getValidIdToken, storeAuthData } from "../../util/firebase-auth";

describe("signup auth token survives local cache clear", () => {
  beforeEach(() => {
    Object.keys(secureStore).forEach((key) => delete secureStore[key]);
    jest.clearAllMocks();
  });

  it("keeps token available for post-signup HTTP calls", async () => {
    await asyncStoreSafeClear();

    await storeAuthData({
      idToken: "fresh-id-token",
      refreshToken: "fresh-refresh",
      expiresIn: "3600",
      localId: "new-user-uid",
    });

    expect(await getValidIdToken()).toBe("fresh-id-token");
  });
});
