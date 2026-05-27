import type { ExpenseData } from "../../util/expense";
import { getEffectiveIsPaid, isPaidString } from "../../util/expense";

function makeExpense(overrides: Partial<ExpenseData> = {}): ExpenseData {
  return {
    id: "e1",
    uid: "u1",
    splitType: "EQUAL",
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: new Date("2026-01-01T00:00:00.000Z"),
    categoryString: "",
    description: "dinner",
    amount: 100,
    date: new Date("2026-01-01T00:00:00.000Z"),
    category: "",
    currency: "EUR",
    whoPaid: "Alice",
    calcAmount: 100,
    splitList: [],
    isSpecialExpense: false,
    ...overrides,
  };
}

describe("Paid back status (getEffectiveIsPaid)", () => {
  it("uses the expense stored isPaid when the trip has no Settlement timestamp", () => {
    const expense = makeExpense({ isPaid: isPaidString.paid });

    expect(getEffectiveIsPaid(expense)).toBe(isPaidString.paid);
    expect(getEffectiveIsPaid(expense, 0)).toBe(isPaidString.paid);
  });

  it("defaults to not paid when the trip has no Settlement timestamp and isPaid is unset", () => {
    const expense = makeExpense({ isPaid: undefined });

    expect(getEffectiveIsPaid(expense)).toBe(isPaidString.notPaid);
  });

  it("treats an expense as paid back when Settlement is after the expense was last edited", () => {
    const expense = makeExpense({
      isPaid: isPaidString.notPaid,
      editedTimestamp: 1000,
    });
    const settlementTimestamp = 2000;

    expect(getEffectiveIsPaid(expense, settlementTimestamp)).toBe(
      isPaidString.paid
    );
  });

  it("keeps the expense stored isPaid when the expense was edited after Settlement", () => {
    const expense = makeExpense({
      isPaid: isPaidString.notPaid,
      editedTimestamp: 3000,
    });
    const settlementTimestamp = 2000;

    expect(getEffectiveIsPaid(expense, settlementTimestamp)).toBe(
      isPaidString.notPaid
    );
  });
});
