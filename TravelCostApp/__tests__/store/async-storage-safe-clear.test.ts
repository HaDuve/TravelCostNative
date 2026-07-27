import AsyncStorage from "@react-native-async-storage/async-storage";

const mmkvStore: Record<string, unknown> = {};

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: {
    CURRENT_TRIP: "currentTrip",
    EXPENSES: "expenses",
  },
  getMMKVObject: jest.fn((key: string) => mmkvStore[key] ?? null),
  setMMKVObject: jest.fn((key: string, value: unknown) => {
    mmkvStore[key] = value;
  }),
  deleteMMKVObject: jest.fn((key: string) => {
    delete mmkvStore[key];
  }),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreRemoveItem: jest.fn(async () => {}),
}));

import { MMKV_KEYS, getMMKVObject, setMMKVObject } from "../../store/mmkv";
import { asyncStoreSafeClear } from "../../store/async-storage";

describe("asyncStoreSafeClear (logout cache)", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
    await AsyncStorage.clear();
  });

  it("clears MMKV Active trip and expenses so a fresh login cannot resurrect them", async () => {
    setMMKVObject(MMKV_KEYS.CURRENT_TRIP, {
      tripid: "prior-trip",
      tripName: "Prior budget",
    });
    setMMKVObject(MMKV_KEYS.EXPENSES, [
      { id: "e1", amount: 12, description: "stale" },
    ]);

    expect(getMMKVObject(MMKV_KEYS.CURRENT_TRIP)).toEqual({
      tripid: "prior-trip",
      tripName: "Prior budget",
    });
    expect(getMMKVObject(MMKV_KEYS.EXPENSES)).toHaveLength(1);

    await asyncStoreSafeClear();

    expect(getMMKVObject(MMKV_KEYS.CURRENT_TRIP)).toBeNull();
    expect(getMMKVObject(MMKV_KEYS.EXPENSES)).toBeNull();
  });
});
