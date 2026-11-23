// Meters Realtime Database download bytes for one device over simulated
// minutes, against an in-memory REST fake (shallow, orderBy/startAt).
import { createFakeRtdb, makeTrip } from "../fixtures/fake-rtdb";
import {
  canAttemptOnlineSetup,
  initialOnlineSetupBackoff,
  recordOnlineSetupFailure,
} from "../../util/online-setup-backoff";

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
const ONLINE_SETUP_TICK_MS = 8_500; // App.tsx: DEBUG_POLLING_INTERVAL * 1.7

function setup() {
  mockStore.clear();
  mockDb.current = createFakeRtdb({
    trips: { [TRIP]: makeTrip({ uids: [ME, OTHER], expensesPerUid: 2000 }) },
    users: { [ME]: { currentTrip: TRIP } },
  });
  const db = mockDb.current;
  const ledgerBytes =
    JSON.stringify(db.root.trips[TRIP][ME].expenses).length * 2;
  return { db, ledgerBytes };
}

function activateDeps(overrides: Record<string, unknown> = {}) {
  const http = require("../../util/http");
  return {
    uid: ME,
    fetchTrip: http.fetchTrip,
    getTravellers: http.getTravellers,
    getAllExpenses: http.getAllExpenses,
    updateUser: async () => {},
    secureStoreGetItem: async () => null,
    secureStoreSetItem: async () => {},
    setCurrentTrip: async () => {},
    saveTripDataInStorage: async () => {},
    saveTravellersInStorage: async () => {},
    setExpenses() {},
    setExpensesCache() {},
    setFreshlyCreatedTo() {},
    ...overrides,
  };
}

/** Mirrors the App.tsx delayedOnlineSetup tick (gate, done flag, backoff). */
async function runOnlineSetupTicks(minutes: number, deps: object) {
  const http = require("../../util/http");
  const { activateTrip } = require("../../util/activate-trip");
  let done = false;
  let backoff = initialOnlineSetupBackoff();
  for (let now = ONLINE_SETUP_TICK_MS; now <= minutes * 60_000; now += ONLINE_SETUP_TICK_MS) {
    if (done || !canAttemptOnlineSetup(backoff, now)) continue;
    await http.fetchUser(ME);
    done = true;
    try {
      await activateTrip(TRIP, deps);
    } catch {
      backoff = recordOnlineSetupFailure(backoff, now);
      done = false;
    }
  }
}

describe("Realtime Database download budget", () => {
  beforeEach(() => jest.resetModules());

  it("RecentExpenses polling stays on delta queries after activation", async () => {
    const { db, ledgerBytes } = setup();
    const http = require("../../util/http");
    const { fetchAndSetExpenses } = require("../../components/ExpensesOutput/RecentExpensesUtil");
    const { activateTrip } = require("../../util/activate-trip");
    await activateTrip(TRIP, activateDeps());
    const afterBoot = db.meter.bytes;
    const ctx = { setIsSyncing() {}, mergeExpenses() {} };

    // 10 minutes of 5s polls; the other Traveller adds an expense every minute.
    for (let tick = 1; tick <= 120; tick++) {
      if (tick % 12 === 0) {
        await http.storeExpense(TRIP, OTHER, {
          amount: 1, calcAmount: 1, date: new Date(), startDate: new Date(),
          endDate: new Date(), description: "new", uid: OTHER, whoPaid: OTHER, splitList: [],
        });
        await http.touchAllTravelers(TRIP, true);
      }
      if (await http.fetchTravelerIsTouched(TRIP, ME)) {
        await fetchAndSetExpenses(false, false, () => {}, () => {}, ctx, TRIP, ME);
      }
    }
    expect(db.meter.bytes - afterBoot).toBeLessThan(ledgerBytes * 0.1);
  });

  it("does not re-download the ledger when the currentTrip mirror PATCH fails", async () => {
    const { db, ledgerBytes } = setup();
    await runOnlineSetupTicks(10, activateDeps({
      updateUser: async () => {
        throw new Error("error while updating user");
      },
    }));
    expect(db.meter.bytes).toBeLessThan(ledgerBytes * 1.5);
  });

  it("backs off full-ledger activations when online setup keeps failing", async () => {
    const { db, ledgerBytes } = setup();
    await runOnlineSetupTicks(10, activateDeps({
      setCurrentTrip: async () => {
        throw new Error("persistent failure");
      },
    }));
    // Without backoff: ~70 full-ledger downloads in 10 minutes.
    expect(db.meter.bytes).toBeLessThan(ledgerBytes * 6);
  });
});
