import React, { useContext, useEffect, useRef } from "react";
import { render, waitFor } from "@testing-library/react-native";
import { ExpensesContext } from "../../store/expenses-context";

jest.mock("../../components/Hooks/useInterval", () => ({
  useInterval: () => {},
}));

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: {
    CURRENT_TRIP: "current_trip",
  },
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
}));

const mockAsyncStoreGetObject = jest.fn(async () => null);
jest.mock("../../store/async-storage", () => ({
  asyncStoreGetObject: (...args: any[]) => mockAsyncStoreGetObject(...args),
  asyncStoreSetObject: jest.fn(),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => null),
}));

function LoadTravellersProbe({
  onResult,
}: {
  onResult: (travellers: unknown) => void;
}) {
  const { TripContext } = require("../../store/trip-context");
  const ctx = useContext(TripContext);
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    ctx.loadTravellersFromStorage().then(onResult);
  }, [ctx, onResult]);
  return null;
}

function LoadTripProbe({ onResult }: { onResult: (trip: unknown) => void }) {
  const { TripContext } = require("../../store/trip-context");
  const ctx = useContext(TripContext);
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    ctx.setCurrentTrip("trip-1", {
      tripid: "trip-1",
      tripName: "Trip",
      totalBudget: "100",
      dailyBudget: "10",
      tripCurrency: "EUR",
      travellers: [],
      startDate: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      endDate: new Date("2026-01-11T00:00:00.000Z").toISOString(),
      isPaidDate: "",
      isPaidTimestamp: undefined,
      isDynamicDailyBudget: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalSum: 123 as any,
    } as any).then(() => onResult(ctx.getcurrentTrip()));
  }, [ctx, onResult]);
  return null;
}

describe("TripContext storage contracts", () => {
  it("loadTravellersFromStorage resolves to [] when storage is empty", async () => {
    mockAsyncStoreGetObject.mockResolvedValueOnce(null);

    const results: unknown[] = [];
    const TripContextProvider = require("../../store/trip-context").default;
    render(
      <ExpensesContext.Provider value={{ expenses: [] } as any}>
        <TripContextProvider>
          <LoadTravellersProbe onResult={(r) => results.push(r)} />
        </TripContextProvider>
      </ExpensesContext.Provider>
    );

    await waitFor(() => {
      expect(results.length).toBeGreaterThan(0);
    });
    expect(results[0]).toEqual([]);
  });

  it("setCurrentTrip drops deprecated totalSum field when present", async () => {
    const results: unknown[] = [];
    const TripContextProvider = require("../../store/trip-context").default;
    render(
      <ExpensesContext.Provider value={{ expenses: [] } as any}>
        <TripContextProvider>
          <LoadTripProbe onResult={(r) => results.push(r)} />
        </TripContextProvider>
      </ExpensesContext.Provider>
    );

    await waitFor(() => {
      expect(results.length).toBeGreaterThan(0);
    });

    expect(results[0]).toBeTruthy();
    expect("totalSum" in (results[0] as any)).toBe(false);
  });
});

