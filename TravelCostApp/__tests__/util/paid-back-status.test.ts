import { getEffectivePaidBack, isPaidString } from "../../util/expense";
import { makeExpense } from "../fixtures/expense";

describe("Paid back status (getEffectivePaidBack)", () => {
  it("uses the expense stored paidBack when the trip has no Settlement timestamp", () => {
    const expense = makeExpense({ paidBack: isPaidString.paid });

    expect(getEffectivePaidBack(expense)).toBe(isPaidString.paid);
    expect(getEffectivePaidBack(expense, 0)).toBe(isPaidString.paid);
  });

  it("defaults to not paid when the trip has no Settlement timestamp and paidBack is unset", () => {
    const expense = makeExpense({ paidBack: undefined });

    expect(getEffectivePaidBack(expense)).toBe(isPaidString.notPaid);
  });

  it("reads legacy isPaid on stored expenses when paidBack is unset", () => {
    const expense = {
      ...makeExpense(),
      isPaid: isPaidString.paid,
    };

    expect(getEffectivePaidBack(expense)).toBe(isPaidString.paid);
  });

  it("treats an expense as paid back when Settlement is after the expense was last edited", () => {
    const expense = makeExpense({
      paidBack: isPaidString.notPaid,
      editedTimestamp: 1000,
    });
    const settlementTimestamp = 2000;

    expect(getEffectivePaidBack(expense, settlementTimestamp)).toBe(
      isPaidString.paid
    );
  });

  it("keeps the expense stored paidBack when the expense was edited after Settlement", () => {
    const expense = makeExpense({
      paidBack: isPaidString.notPaid,
      editedTimestamp: 3000,
    });
    const settlementTimestamp = 2000;

    expect(getEffectivePaidBack(expense, settlementTimestamp)).toBe(
      isPaidString.notPaid
    );
  });
});
