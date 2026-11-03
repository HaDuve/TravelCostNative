import axios from "axios";
import { fetchTrip, fetchTripName, updateTrip } from "../../util/http";
import { isPaidString } from "../../util/expense";
import { MMKV_KEY_PATTERNS } from "../../store/mmkv-keys";

const mmkvStore: Record<string, string> = {};

jest.mock("axios");
jest.mock("../../util/firebase-auth", () => ({
  getValidIdToken: jest.fn(async () => "test-token"),
}));
jest.mock("../../util/error", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../store/mmkv", () => ({
  getMMKVString: jest.fn((key: string) => mmkvStore[key] ?? ""),
  setMMKVString: jest.fn((key: string, value: string) => {
    mmkvStore[key] = value;
  }),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

const BACKEND =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

describe("fetchTrip metadata (no Expenses download)", () => {
  beforeEach(() => {
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
    jest.clearAllMocks();
  });

  it("loads trip metadata via leaf GETs so shallow true placeholders never become string fields", async () => {
    // Real Firebase shallow=true on a trip object returns every child as true
    // (scalars included). Scalars must be read from leaf paths instead.
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.includes("shallow=true") && url.includes(`/trips/trip-1.json`)) {
        return {
          data: {
            tripName: true,
            totalBudget: true,
            dailyBudget: true,
            tripCurrency: true,
            startDate: true,
            endDate: true,
            isPaid: true,
            isPaidDate: true,
            isPaidTimestamp: true,
            isDynamicDailyBudget: true,
            isImplicitDefault: true,
            categories: true,
            travellers: true,
            tokens: true,
            "uid-alice": true,
          },
        };
      }
      if (url.includes(`/trips/trip-1/travellers.json`)) {
        return {
          data: {
            keyA: { uid: "uid-alice", userName: "Alice", touched: false },
          },
        };
      }
      const leafMatch = url.match(/\/trips\/trip-1\/([^/.]+)\.json/);
      if (leafMatch) {
        const leaf = leafMatch[1];
        const leaves: Record<string, unknown> = {
          tripName: "Bali",
          totalBudget: "5000",
          dailyBudget: "100",
          tripCurrency: "EUR",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          isPaid: isPaidString.notPaid,
          isPaidDate: "",
          isPaidTimestamp: null,
          isDynamicDailyBudget: true,
          isImplicitDefault: false,
          categories: JSON.stringify([{ catId: "food", catName: "Food" }]),
          tripProgress: null,
        };
        if (leaf in leaves) return { data: leaves[leaf] };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    const trip = await fetchTrip("trip-1");

    const requestedUrls = mockedAxios.get.mock.calls.map((c) => c[0] as string);
    expect(requestedUrls.some((u) => u.includes("shallow=true"))).toBe(true);
    expect(
      requestedUrls.some((u) =>
        u.startsWith(`${BACKEND}/trips/trip-1.json?auth=`) &&
        !u.includes("shallow=true")
      )
    ).toBe(false);
    expect(
      requestedUrls.some((u) => u.includes(`/trips/trip-1/travellers.json`))
    ).toBe(true);
    expect(
      requestedUrls.some((u) => u.includes(`/trips/trip-1/tripCurrency.json`))
    ).toBe(true);
    expect(
      requestedUrls.some((u) => u.includes(`/trips/trip-1/totalBudget.json`))
    ).toBe(true);

    expect(trip).toMatchObject({
      tripName: "Bali",
      totalBudget: "5000",
      dailyBudget: "100",
      tripCurrency: "EUR",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      isDynamicDailyBudget: true,
      isImplicitDefault: false,
      travellers: [{ uid: "uid-alice", userName: "Alice" }],
    });
    expect(trip.tripCurrency).not.toBe(true);
    expect(trip.totalBudget).not.toBe(true);
    expect(trip).not.toHaveProperty("tokens");
    expect(trip).not.toHaveProperty("uid-alice");
    expect((trip as Record<string, unknown>).travellers).not.toBe(true);
  });

  it("only leaf-fetches metadata keys present on the shallow map", async () => {
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.includes("shallow=true") && url.includes(`/trips/trip-sparse.json`)) {
        return {
          data: {
            tripName: true,
            tripCurrency: true,
            travellers: true,
            "uid-alice": true,
          },
        };
      }
      if (url.includes(`/trips/trip-sparse/travellers.json`)) {
        return { data: {} };
      }
      if (url.includes(`/trips/trip-sparse/tripName.json`)) {
        return { data: "Sparse" };
      }
      if (url.includes(`/trips/trip-sparse/tripCurrency.json`)) {
        return { data: "EUR" };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    const trip = await fetchTrip("trip-sparse");

    const requestedUrls = mockedAxios.get.mock.calls.map((c) => c[0] as string);
    expect(requestedUrls.some((u) => u.includes(`/trips/trip-sparse/tripName.json`))).toBe(
      true
    );
    expect(
      requestedUrls.some((u) => u.includes(`/trips/trip-sparse/tripCurrency.json`))
    ).toBe(true);
    expect(
      requestedUrls.some((u) => u.includes(`/trips/trip-sparse/totalBudget.json`))
    ).toBe(false);
    expect(
      requestedUrls.some((u) => u.includes(`/trips/trip-sparse/startDate.json`))
    ).toBe(false);
    expect(trip).toMatchObject({ tripName: "Sparse", tripCurrency: "EUR" });
  });

  it("returns null when the trip node is missing so callers can treat it as not found", async () => {
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.includes("shallow=true") && url.includes(`/trips/missing-trip.json`)) {
        return { data: null };
      }
      if (url.includes(`/trips/missing-trip/travellers.json`)) {
        return { data: null };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    await expect(fetchTrip("missing-trip")).resolves.toBeNull();
  });

  it("loads categories from the categories leaf alongside other metadata leaves", async () => {
    const categoriesJson = JSON.stringify([
      { cat: "food", catString: "Food", icon: "food", color: "#000" },
    ]);
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.includes("shallow=true") && url.includes(`/trips/trip-cats.json`)) {
        return {
          data: {
            tripName: true,
            tripCurrency: true,
            totalBudget: true,
            dailyBudget: true,
            categories: true,
            travellers: true,
          },
        };
      }
      if (url.includes(`/trips/trip-cats/travellers.json`)) {
        return { data: {} };
      }
      const leafMatch = url.match(/\/trips\/trip-cats\/([^/.]+)\.json/);
      if (leafMatch) {
        const leaf = leafMatch[1];
        const leaves: Record<string, unknown> = {
          tripName: "Bali",
          tripCurrency: "EUR",
          totalBudget: "100",
          dailyBudget: "10",
          categories: categoriesJson,
        };
        return { data: leaf in leaves ? leaves[leaf] : null };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    const trip = await fetchTrip("trip-cats");
    expect(trip.categories).toBe(categoriesJson);
    expect(
      mockedAxios.get.mock.calls.some((c) =>
        String(c[0]).includes(`/trips/trip-cats/categories.json`)
      )
    ).toBe(true);
  });

  it("fetchTripName reads the tripName leaf and caches it so a second call skips the network", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: "Japan 2026" });

    await expect(fetchTripName("trip-name-1")).resolves.toBe("Japan 2026");
    await expect(fetchTripName("trip-name-1")).resolves.toBe("Japan 2026");

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const url = mockedAxios.get.mock.calls[0][0] as string;
    expect(url).toContain(`/trips/trip-name-1/tripName.json?auth=`);
    expect(url).not.toMatch(/\/trips\/trip-name-1\.json\?auth=/);
    expect(mmkvStore[MMKV_KEY_PATTERNS.TRIP_NAME("trip-name-1")]).toBe(
      "Japan 2026"
    );
  });

  it("updateTrip PATCHes only metadata fields — no Traveller expense subtree, roster, or true placeholders", async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: null });

    const dangerousWriteBack = {
      tripName: "Bali",
      totalBudget: "5000",
      dailyBudget: "100",
      tripCurrency: "EUR",
      isPaid: isPaidString.paid,
      isPaidDate: "2026-06-01T00:00:00.000Z",
      isPaidTimestamp: 1_717_200_000_000,
      isDynamicDailyBudget: true,
      // Accidental shallow placeholders / expense subtree on a settle write-back
      travellers: true,
      tokens: true,
      "uid-alice": true,
      expenses: [{ amount: "10" }],
    };

    await updateTrip("trip-settle-1", dangerousWriteBack as never);

    expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
    const [, payload] = mockedAxios.patch.mock.calls[0];
    expect(payload).toEqual({
      tripName: "Bali",
      totalBudget: "5000",
      dailyBudget: "100",
      tripCurrency: "EUR",
      isPaid: isPaidString.paid,
      isPaidDate: "2026-06-01T00:00:00.000Z",
      isPaidTimestamp: 1_717_200_000_000,
      isDynamicDailyBudget: true,
    });
    expect(payload).not.toHaveProperty("travellers");
    expect(payload).not.toHaveProperty("expenses");
    expect(payload).not.toHaveProperty("uid-alice");
    expect(payload).not.toHaveProperty("tokens");
  });
});

/**
 * Live confirmation (2026-11-01): Firebase RTDB accepts shallow=true together with
 * auth= on this project's database. A GET of
 * `/.json?shallow=true&auth=invalid-token` returned HTTP 200 with truncated keys
 * (`{"server":true,"trips":true,"users":true}`), not a 400 about mixed query
 * params. Official retrieve-data docs (updated 2026-10-20) restrict shallow only
 * against filtering params (orderBy/limit/…), not against auth.
 *
 * Important (same docs): shallow on an *object* truncates every child value to
 * `true`, including string leaves — so trip metadata must be read from leaf
 * paths, not taken from the shallow body.
 */

