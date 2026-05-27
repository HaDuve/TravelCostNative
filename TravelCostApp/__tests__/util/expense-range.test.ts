jest.mock("../../store/mmkv", () => {
  return {
    getMMKVObject: jest.fn(() => null),
    getMMKVString: jest.fn(() => ""),
    setMMKVObject: jest.fn(),
    setMMKVString: jest.fn(),
    MMKV_KEY_PATTERNS: {},
  };
});

jest.mock("../../util/http", () => {
  return {
    getAllExpenses: jest.fn(async () => []),
  };
});

jest.mock("../../util/offline-queue", () => {
  return {
    deleteExpenseOnlineOffline: jest.fn(async () => {}),
  };
});

import type { ExpenseData } from "../../util/expense";
const { getExpensesSumPeriod, getExpensesSumTotal } = require("../../util/expense");

const START = new Date("2026-01-01T00:00:00.000Z");
const END = new Date("2026-01-31T00:00:00.000Z");
const DATE = new Date("2026-01-01T00:00:00.000Z");

function makeExpense(params: {
  id: string;
  rangeId: string;
  description: string;
  whoPaid: string;
  amount: number;
  calcAmount: number;
}): ExpenseData {
  return {
    id: params.id,
    uid: "u1",
    splitType: "EQUAL",
    startDate: START,
    endDate: END,
    categoryString: "",
    description: params.description,
    amount: params.amount,
    date: DATE,
    category: "",
    currency: "EUR",
    whoPaid: params.whoPaid,
    calcAmount: params.calcAmount,
    duplOrSplit: undefined,
    splitList: [],
    rangeId: params.rangeId,
    isSpecialExpense: false,
  } as ExpenseData;
}

describe("Ranged expense deduplication", () => {
  it("counts each ranged expense once in getExpensesSumTotal (dedup by rangeId)", () => {
    const expenses: ExpenseData[] = [
      makeExpense({
        id: "e1",
        rangeId: "r1",
        description: "range e1",
        whoPaid: "Alice",
        amount: 100,
        calcAmount: 100,
      }),
      makeExpense({
        id: "e2",
        rangeId: "r1",
        description: "range e2",
        whoPaid: "Alice",
        amount: 100,
        calcAmount: 100,
      }),
      makeExpense({
        id: "e3",
        rangeId: "r2",
        description: "range e3",
        whoPaid: "Bob",
        amount: 50,
        calcAmount: 50,
      }),
    ];

    expect(getExpensesSumTotal(expenses)).toBe(150);
  });

  it("counts all days in getExpensesSumPeriod (no dedup by rangeId)", () => {
    const expenses: ExpenseData[] = [
      makeExpense({
        id: "e1",
        rangeId: "r1",
        description: "range e1",
        whoPaid: "Alice",
        amount: 100,
        calcAmount: 100,
      }),
      makeExpense({
        id: "e2",
        rangeId: "r1",
        description: "range e2",
        whoPaid: "Alice",
        amount: 100,
        calcAmount: 100,
      }),
      makeExpense({
        id: "e3",
        rangeId: "r2",
        description: "range e3",
        whoPaid: "Bob",
        amount: 50,
        calcAmount: 50,
      }),
    ];

    expect(getExpensesSumPeriod(expenses)).toBe(250);
  });
});

