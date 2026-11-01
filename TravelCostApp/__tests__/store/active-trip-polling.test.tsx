import React from "react";
import { act, render } from "@testing-library/react-native";
import { ExpensesContext } from "../../store/expenses-context";

const mockFetchTrip = jest.fn();
jest.mock("../../util/http", () => ({
  fetchTrip: (...args: unknown[]) => mockFetchTrip(...args),
  fetchUser: jest.fn(async () => ({ currentTrip: "trip-1" })),
  getTravellers: jest.fn(async () => [{ uid: "u1", userName: "Me" }]),
  updateTrip: jest.fn(),
}));

jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => ({ isFastEnough: true })),
}));

jest.mock("../../util/active-trip-id", () => ({
  getActiveTripId: jest.fn(async () => "trip-1"),
}));

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: { CURRENT_TRIP: "current_trip" },
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
}));

jest.mock("../../store/async-storage", () => ({
  asyncStoreGetObject: jest.fn(async () => null),
  asyncStoreSetObject: jest.fn(),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => "u1"),
}));

function tripNamed(tripName: string) {
  return {
    tripName,
    tripCurrency: "EUR",
    totalBudget: "0",
    dailyBudget: "0",
    isDynamicDailyBudget: false,
    isImplicitDefault: tripName === "",
  };
}

async function fetchTripCallsAfter(ms: number, tripName: string) {
  mockFetchTrip.mockImplementation(async () => tripNamed(tripName));
  const TripContextProvider = require("../../store/trip-context").default;
  render(
    <ExpensesContext.Provider value={{ expenses: [] } as never}>
      <TripContextProvider>{null}</TripContextProvider>
    </ExpensesContext.Provider>
  );
  for (let elapsed = 0; elapsed < ms; elapsed += 500) {
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
  }
  return mockFetchTrip.mock.calls.length;
}

jest.setTimeout(60_000);

describe("TripContext active-trip polling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchTrip.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("fetches a named Active trip once, then stops polling", async () => {
    expect(await fetchTripCallsAfter(60_000, "Bali")).toBe(1);
  });

  it("fetches an implicit default trip (empty tripName) once, then stops polling", async () => {
    expect(await fetchTripCallsAfter(60_000, "")).toBe(1);
  });
});
