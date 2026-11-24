// Regression tests for ledger fetch resilience (RTDB bandwidth + partial ledger).
import { createFakeRtdb, makeTrip } from "../fixtures/fake-rtdb";

const mockDb: { current: ReturnType<typeof createFakeRtdb> | null } = {
  current: null,
};
jest.mock("axios", () => {
  const proxy: any = {
    defaults: {},
    interceptors: { request: { use: () => 0 }, response: { use: () => 0 } },
  };
  for (const m of ["get", "patch", "put", "post", "delete"]) {
    proxy[m] = (...a: any[]) => mockDb.current!.axiosImpl[m](...a);
  }
  proxy.create = () => proxy;
  return { __esModule: true, default: proxy, ...proxy };
});
jest.mock("../../util/firebase-auth", () => ({
  getValidIdToken: async () => "tok",
}));
const mockStore = new Map<string, string>();
jest.mock("../../store/mmkv", () => ({
  ...jest.requireActual("../../store/mmkv-keys"),
  getMMKVString: (k: string) => mockStore.get(k),
  setMMKVString: (k: string, v: string) => mockStore.set(k, v),
  getMMKVObject: (k: string) =>
    mockStore.has(k) ? JSON.parse(mockStore.get(k)!) : null,
  setMMKVObject: (k: string, v: unknown) => mockStore.set(k, JSON.stringify(v)),
}));

const TRIP = "trip1";
const ME = "me";
const OTHER = "other";

function setup() {
  mockStore.clear();
  mockDb.current = createFakeRtdb({
    trips: { [TRIP]: makeTrip({ uids: [ME, OTHER], expensesPerUid: 500 }) },
  });
  const db = mockDb.current;
  const ledgerBytes = (
    ["me", "other"].map((u) => JSON.stringify(db.root.trips[TRIP][u].expenses).length)
  ).reduce((a, b) => a + b, 0);
  return { db, ledgerBytes };
}

describe("fetchExpensesWithUIDs", () => {
  beforeEach(() => jest.resetModules());

  it("shares one in-flight ledger download between concurrent callers", async () => {
    const { db, ledgerBytes } = setup();
    const http = require("../../util/http");
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        http.fetchExpensesWithUIDs(TRIP, [ME, OTHER], false)
      )
    );
    expect(results.every((r: unknown[]) => r.length === 1000)).toBe(true);
    expect(db.meter.bytes).toBeLessThan(ledgerBytes * 1.2);
  });

  it("full replace fetch throws when a Traveller's ledger fails, and keeps lastFetch", async () => {
    const { db } = setup();
    const http = require("../../util/http");
    const realGet = db.axiosImpl.get;
    db.axiosImpl.get = async (url: string) => {
      if (url.includes(`/${OTHER}/expenses`)) throw new Error("timeout");
      return realGet(url);
    };
    await expect(
      http.fetchExpensesWithUIDs(TRIP, [ME, OTHER], false)
    ).rejects.toThrow();
    const { getLastFetchTimestamp } = require("../../util/last-fetch-timestamp");
    expect(getLastFetchTimestamp(TRIP)).toBe(0);
  });

  it("delta fetch tolerates a failing Traveller without advancing past it", async () => {
    const { db } = setup();
    const http = require("../../util/http");
    await http.fetchExpensesWithUIDs(TRIP, [ME, OTHER], false);
    const { getLastFetchTimestamp } = require("../../util/last-fetch-timestamp");
    const before = getLastFetchTimestamp(TRIP);
    const realGet = db.axiosImpl.get;
    db.axiosImpl.get = async (url: string) => {
      if (url.includes(`/${OTHER}/expenses`)) throw new Error("timeout");
      return realGet(url);
    };
    await expect(
      http.fetchExpensesWithUIDs(TRIP, [ME, OTHER], true)
    ).resolves.toBeDefined();
    expect(getLastFetchTimestamp(TRIP)).toBe(before);
  });
});
