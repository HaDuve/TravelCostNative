import { getTripData } from "../../util/trip";
import { MMKV_KEY_PATTERNS } from "../../store/mmkv-keys";

const mmkvStore: Record<string, unknown> = {};

jest.mock("../../store/mmkv", () => ({
  getMMKVObject: jest.fn((key: string) => mmkvStore[key] ?? null),
  getMMKVString: jest.fn((key: string) =>
    typeof mmkvStore[key] === "string" ? mmkvStore[key] : ""
  ),
  setMMKVObject: jest.fn((key: string, value: unknown) => {
    mmkvStore[key] = value;
  }),
  setMMKVString: jest.fn((key: string, value: string) => {
    mmkvStore[key] = value;
  }),
  MMKV_KEY_PATTERNS: jest.requireActual("../../store/mmkv-keys").MMKV_KEY_PATTERNS,
}));

jest.mock("../../util/http", () => ({
  fetchTrip: jest.fn(),
}));

import { fetchTrip } from "../../util/http";

const mockedFetchTrip = fetchTrip as jest.MockedFunction<typeof fetchTrip>;

describe("getTripData", () => {
  beforeEach(() => {
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
    jest.clearAllMocks();
  });

  it("refetches when today's cache holds shallow true placeholders instead of string metadata", async () => {
    const tripid = "poisoned-trip";
    mmkvStore[MMKV_KEY_PATTERNS.TRIP(tripid)] = {
      tripName: true,
      tripCurrency: true,
      totalBudget: true,
      startDate: true,
      endDate: true,
    };
    mmkvStore[MMKV_KEY_PATTERNS.TRIP_LAST_UPDATE_ISO(tripid)] =
      new Date().toISOString();

    mockedFetchTrip.mockResolvedValueOnce({
      tripName: "Bali",
      tripCurrency: "EUR",
      totalBudget: "5000",
      dailyBudget: "100",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      travellers: [],
    });

    const trip = await getTripData(tripid);

    expect(mockedFetchTrip).toHaveBeenCalledWith(tripid);
    expect(trip).toMatchObject({
      tripName: "Bali",
      tripCurrency: "EUR",
      totalBudget: "5000",
    });
    expect(trip.tripCurrency).not.toBe(true);
  });
});
