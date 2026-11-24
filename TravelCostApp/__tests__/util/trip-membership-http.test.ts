import axios from "axios";
import {
  ensureTripMembership,
  fetchServerInfo,
  fetchTrip,
  fetchUserName,
  resetEnsuredTripMemberships,
  SERVER_CONFIG_KEYS,
  storeTrip,
} from "../../util/http";

const secureStore: Record<string, string> = {};

jest.mock("axios");
jest.mock("../../util/firebase-auth", () => ({
  getValidIdToken: jest.fn(async () => "test-token"),
}));
jest.mock("../../util/error", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../store/mmkv", () => ({
  getMMKVString: jest.fn(() => ""),
  setMMKVString: jest.fn(),
}));
jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async (key: string) => secureStore[key] ?? null),
  secureStoreSetItem: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const BACKEND =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

beforeEach(() => {
  jest.clearAllMocks();
  resetEnsuredTripMemberships();
  Object.keys(secureStore).forEach((key) => delete secureStore[key]);
  secureStore.uid = "uid-alice";
  mockedAxios.put.mockResolvedValue({ data: true });
});

describe("ensureTripMembership", () => {
  it("writes the stored uid under trips/<tripid>/members once per session", async () => {
    await expect(ensureTripMembership("trip-1")).resolves.toBe(true);
    await expect(ensureTripMembership("trip-1")).resolves.toBe(true);

    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${BACKEND}/trips/trip-1/members/uid-alice.json?auth=test-token`,
      true
    );
  });

  it("uses an explicit uid when given", async () => {
    await ensureTripMembership("trip-1", "uid-bob");
    expect(mockedAxios.put).toHaveBeenCalledWith(
      `${BACKEND}/trips/trip-1/members/uid-bob.json?auth=test-token`,
      true
    );
  });

  it("returns false without a uid or when the write fails, and retries later", async () => {
    delete secureStore.uid;
    await expect(ensureTripMembership("trip-1")).resolves.toBe(false);
    expect(mockedAxios.put).not.toHaveBeenCalled();

    secureStore.uid = "uid-alice";
    mockedAxios.put.mockRejectedValueOnce(new Error("403"));
    await expect(ensureTripMembership("trip-1")).resolves.toBe(false);
    await expect(ensureTripMembership("trip-1")).resolves.toBe(true);
    expect(mockedAxios.put).toHaveBeenCalledTimes(2);
  });
});

describe("storeTrip", () => {
  it("creates the trip with the creator as a member", async () => {
    mockedAxios.post.mockResolvedValue({ data: { name: "trip-new" } });

    await expect(storeTrip({ tripName: "Bali" }, "uid-alice")).resolves.toBe(
      "trip-new"
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BACKEND}/trips.json?auth=test-token`,
      { tripName: "Bali", members: { "uid-alice": true } }
    );

    // Membership is already known: loading the new trip writes nothing more.
    await ensureTripMembership("trip-new");
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it("refuses to create a trip without the creator's uid", async () => {
    await expect(storeTrip({ tripName: "Bali" }, "")).rejects.toThrow();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});

describe("fetchTrip", () => {
  it("ensures membership before reading the trip", async () => {
    const order: string[] = [];
    mockedAxios.put.mockImplementation(async (url: string) => {
      order.push(`PUT ${url}`);
      return { data: true };
    });
    mockedAxios.get.mockImplementation(async (url: string) => {
      order.push(`GET ${url}`);
      if (url.includes("shallow=true")) return { data: { tripName: true } };
      if (url.includes("/tripName.json")) return { data: "Bali" };
      return { data: null };
    });

    const trip = await fetchTrip("trip-1");

    expect(trip.tripName).toBe("Bali");
    expect(order[0]).toBe(
      `PUT ${BACKEND}/trips/trip-1/members/uid-alice.json?auth=test-token`
    );
  });
});

describe("fetchServerInfo", () => {
  it("reads each config leaf instead of the whole server node", async () => {
    mockedAxios.get.mockImplementation(async (url: string) => {
      const key = url.match(/\/server\/([^/.]+)\.json/)?.[1];
      return { data: key === "BRAN" ? null : `value-${key}` };
    });

    const data = await fetchServerInfo();

    const urls = mockedAxios.get.mock.calls.map(([url]) => url);
    expect(urls).toHaveLength(SERVER_CONFIG_KEYS.length);
    expect(urls.some((url) => url.includes("/server.json"))).toBe(false);
    expect(urls.some((url) => url.includes("feedback"))).toBe(false);
    expect(data).toMatchObject({ VEXO: "value-VEXO", OPENAI: "value-OPENAI" });
    expect(data).not.toHaveProperty("BRAN");
  });

  it("returns null when no config is set", async () => {
    mockedAxios.get.mockResolvedValue({ data: null });
    await expect(fetchServerInfo()).resolves.toBeNull();
  });
});

describe("fetchUserName", () => {
  it("reads only the userName leaf of another user", async () => {
    mockedAxios.get.mockResolvedValue({ data: "Bea" });
    await expect(fetchUserName("uid-bea")).resolves.toBe("Bea");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${BACKEND}/users/uid-bea/userName.json?auth=test-token`,
      expect.anything()
    );
  });
});
