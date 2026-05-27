import { getEffectiveIsPaid, isPaidString } from "../../util/expense";
import { makeExpense } from "../fixtures/expense";

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
