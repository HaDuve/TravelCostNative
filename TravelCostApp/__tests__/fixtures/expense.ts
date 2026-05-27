import type { ExpenseData } from "../../util/expense";

export function makeExpense(overrides: Partial<ExpenseData> = {}): ExpenseData {
  return {
    id: "e1",
    uid: "u1",
    splitType: "EQUAL",
    startDate: new Date("2026-01-15T12:00:00.000Z"),
    endDate: new Date("2026-01-15T12:00:00.000Z"),
    categoryString: "Food",
    description: "dinner",
    amount: 100,
    date: new Date("2026-01-15T12:00:00.000Z"),
    category: "Food",
    currency: "EUR",
    whoPaid: "Alice",
    calcAmount: 100,
    splitList: [
      { userName: "Alice", amount: 50 },
      { userName: "Bob", amount: 50 },
    ],
    isSpecialExpense: false,
    ...overrides,
  };
}
