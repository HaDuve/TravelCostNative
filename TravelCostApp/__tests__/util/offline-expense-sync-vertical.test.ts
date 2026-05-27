/**
 * Repro (#230): create expense offline → go online → sync/refresh → one ledger row.
 * Vertical slice: offline ADD → queue upload (server id) → UPDATE_ID → MERGE from fetch.
 */
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(async () => ({ isConnected: true })),
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => ({ isFastEnough: true })),
}));

jest.mock("../../util/http", () => ({
  storeExpenseWithId: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  touchAllTravelers: jest.fn(async () => {}),
  unTouchTraveler: jest.fn(async () => {}),
  getAllExpenses: jest.fn(),
}));

const mmkvStore: Record<string, unknown> = {};

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: {
    OFFLINE_QUEUE: "offlineQueue",
  },
  getMMKVObject: jest.fn((key: string) => mmkvStore[key] ?? null),
  setMMKVObject: jest.fn((key: string, value: unknown) => {
    mmkvStore[key] = value;
  }),
}));

import { fetchAndSetExpenses } from "../../components/ExpensesOutput/RecentExpensesUtil";
import {
  expensesReducer,
  mergeExpenseLists,
} from "../../store/expenses-context";
import { MMKV_KEYS } from "../../store/mmkv";
import { getAllExpenses, storeExpenseWithId } from "../../util/http";
import { sendOfflineQueue } from "../../util/offline-queue";
import { makeExpense } from "../fixtures/expense";

describe("offline expense sync (#230)", () => {
  const editedTimestamp = 1_700_000_000_000;
  const expenseDate = new Date("2026-01-15T12:00:00.000Z");
  const sharedFields = {
    editedTimestamp,
    amount: 42,
    description: "street food",
    date: expenseDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
  });

  it("offline add → queue flush with new server id → fetch merge → one expense in list state", async () => {
    const clientId = "local-offline-id";
    const serverId = "server-generated-id";
    const offlineExpense = makeExpense({ id: clientId, ...sharedFields });

    let listState = expensesReducer([], { type: "ADD", payload: offlineExpense });

    mmkvStore[MMKV_KEYS.OFFLINE_QUEUE] = [
      {
        type: "add",
        expense: {
          tripid: "trip-1",
          uid: "u1",
          expenseData: offlineExpense,
        },
      },
    ];

    (storeExpenseWithId as jest.Mock).mockResolvedValue(serverId);

    const updateExpenseId = (oldId: string, newId: string) => {
      listState = expensesReducer(listState, {
        type: "UPDATE_ID",
        payload: { oldId, newId },
      });
    };

    await sendOfflineQueue(false, jest.fn(), { updateExpenseId });

    const serverExpense = makeExpense({
      id: serverId,
      ...sharedFields,
      serverTimestamp: editedTimestamp + 1,
    });

    (getAllExpenses as jest.Mock).mockResolvedValue([serverExpense]);

    const mergeExpenses = jest.fn();
    const tripCtx = { setTotalSum: jest.fn() };

    await fetchAndSetExpenses(
      false,
      false,
      jest.fn(),
      jest.fn(),
      {
        expenses: listState,
        mergeExpenses,
        setIsSyncing: jest.fn(),
      } as any,
      "trip-1",
      "u1",
      tripCtx as any
    );

    expect(mergeExpenses).toHaveBeenCalledWith([serverExpense]);

    const ledgerState = mergeExpenseLists(listState, [serverExpense]);
    expect(ledgerState).toHaveLength(1);
    expect(ledgerState[0].id).toBe(serverId);
    expect(ledgerState.map((expense) => expense.id)).not.toContain(clientId);
  });
});
