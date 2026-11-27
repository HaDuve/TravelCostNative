import {
  addShadowItemsToExpenses,
  isShadowExpense,
} from "../../components/ExpensesOutput/ExpenseListUtil";
import { makeExpense } from "../fixtures/expense";

describe("isShadowExpense", () => {
  it("recognises every padding row added to a short list", () => {
    const rows = [];
    addShadowItemsToExpenses(rows);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(isShadowExpense)).toBe(true);
  });

  it("does not treat a real Expense as padding, even if its id contains 'shadow'", () => {
    expect(isShadowExpense(makeExpense({ id: "e1" }))).toBe(false);
    expect(isShadowExpense(makeExpense({ id: "-Nx-shadow" }))).toBe(false);
  });

  it("does not treat a row without an id as padding", () => {
    expect(isShadowExpense({})).toBe(false);
    expect(isShadowExpense(undefined)).toBe(false);
  });
});
