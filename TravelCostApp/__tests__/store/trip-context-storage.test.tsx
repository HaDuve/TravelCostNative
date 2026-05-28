import React, { useContext, useEffect } from "react";
import { render, waitFor } from "@testing-library/react-native";

import TripContextProvider, { TripContext } from "../../store/trip-context";
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
  const ctx = useContext(TripContext);
  useEffect(() => {
    ctx.loadTravellersFromStorage().then(onResult);
  }, [ctx, onResult]);
  return null;
}

describe("TripContext storage contracts", () => {
  it("loadTravellersFromStorage resolves to [] when storage is empty", async () => {
    mockAsyncStoreGetObject.mockResolvedValueOnce(null);

    const results: unknown[] = [];
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
});

