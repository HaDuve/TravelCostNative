import { createImplicitDefaultForUser } from "../../util/create-implicit-default-for-user";
import {
  putTravelerInTrip,
  storeTrip,
  updateTripHistory,
  updateUser,
} from "../../util/http";
import { secureStoreSetItem } from "../../store/secure-storage";
import { getMMKVObject } from "../../store/mmkv";

jest.mock("../../util/http", () => ({
  putTravelerInTrip: jest.fn(async () => ({})),
  storeTrip: jest.fn(async () => "trip-implicit-1"),
  updateTripHistory: jest.fn(async () => undefined),
  updateUser: jest.fn(async () => undefined),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreSetItem: jest.fn(async () => undefined),
}));

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: { CATEGORY_LIST: "categoryList" },
  getMMKVObject: jest.fn(() => null),
}));

jest.mock("expo-localization", () => ({
  getLocales: () => [{ currencyCode: "USD", languageCode: "en" }],
}));

describe("createImplicitDefaultForUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("preserves existing Trip history when creating an implicit default Active trip", async () => {
    const setCurrentTrip = jest.fn(async () => undefined);
    const setFreshlyCreatedTo = jest.fn(async () => undefined);
    const setTripHistory = jest.fn();

    await createImplicitDefaultForUser({
      uid: "u1",
      userName: "Alice",
      existingTripHistory: ["trip-old-1"],
      setCurrentTrip,
      setFreshlyCreatedTo,
      setTripHistory,
    });

    expect(storeTrip).toHaveBeenCalledWith(
      expect.objectContaining({ isImplicitDefault: true, tripCurrency: "USD" })
    );
    expect(updateTripHistory).toHaveBeenCalledWith("u1", "trip-implicit-1");
    expect(setTripHistory).toHaveBeenCalledWith([
      "trip-old-1",
      "trip-implicit-1",
    ]);
    expect(setCurrentTrip).toHaveBeenCalledWith(
      "trip-implicit-1",
      expect.objectContaining({ isImplicitDefault: true })
    );
    expect(setFreshlyCreatedTo).toHaveBeenCalledWith(false);
    expect(putTravelerInTrip).toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalled();
    expect(secureStoreSetItem).toHaveBeenCalledWith(
      "currentTripId",
      "trip-implicit-1"
    );
    expect(getMMKVObject).toHaveBeenCalled();
  });
});
