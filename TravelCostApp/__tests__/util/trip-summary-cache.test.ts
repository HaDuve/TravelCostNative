import {
  invalidateAllTripsAsObjectCache,
  patchActiveTripNameInList,
  updateTripNameInAllTripsCache,
} from "../../util/trip-summary-cache";

jest.mock("../../store/mmkv", () => ({
  deleteMMKVObject: jest.fn(),
  getMMKVObject: jest.fn(),
  setMMKVObject: jest.fn(),
  MMKV_KEYS: {
    ALL_TRIPS_AS_OBJECT: "allTripsAsObject",
    ALL_TRIPS_AS_OBJECT_CACHE_ISO_DATE: "allTripsAsObjectCacheIsoDate",
  },
}));

import {
  deleteMMKVObject,
  getMMKVObject,
  setMMKVObject,
  MMKV_KEYS,
} from "../../store/mmkv";

describe("trip summary cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("invalidates cached trip names", () => {
    invalidateAllTripsAsObjectCache();

    expect(deleteMMKVObject).toHaveBeenCalledWith(
      MMKV_KEYS.ALL_TRIPS_AS_OBJECT
    );
    expect(deleteMMKVObject).toHaveBeenCalledWith(
      MMKV_KEYS.ALL_TRIPS_AS_OBJECT_CACHE_ISO_DATE
    );
  });

  it("updates a renamed trip inside today's cache", () => {
    (getMMKVObject as jest.Mock).mockReturnValue([
      { tripid: "t1", tripname: "", selected: true },
      { tripid: "t2", tripname: "Japan", selected: true },
    ]);

    updateTripNameInAllTripsCache("t1", "Home budget");

    expect(setMMKVObject).toHaveBeenCalledWith(MMKV_KEYS.ALL_TRIPS_AS_OBJECT, [
      { tripid: "t1", tripname: "Home budget", selected: true },
      { tripid: "t2", tripname: "Japan", selected: true },
    ]);
  });

  it("patches the Active trip name over a stale cached value", () => {
    const patched = patchActiveTripNameInList(
      [{ tripid: "t1", tripname: "", selected: true }],
      "t1",
      "Home budget"
    );

    expect(patched[0].tripname).toBe("Home budget");
  });
});
