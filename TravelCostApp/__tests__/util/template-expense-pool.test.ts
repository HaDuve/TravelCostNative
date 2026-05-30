import type { ExpenseData } from "../../util/expense";
import { expensesForTemplateSelection } from "../../util/template-expense-pool";
import { makeExpense } from "../fixtures/expense";

function expenseWithTimestamp(
  id: string,
  editedTimestamp: number
): ExpenseData {
  return makeExpense({ id, editedTimestamp });
}

describe("expensesForTemplateSelection", () => {
  it("returns all expenses when count is at most 250", () => {
    const expenses = Array.from({ length: 250 }, (_, i) =>
      expenseWithTimestamp(`e-${i}`, i)
    );

    expect(expensesForTemplateSelection(expenses)).toBe(expenses);
  });

  it("returns the 250 newest expenses by editedTimestamp when count exceeds 250", () => {
    const expenses = Array.from({ length: 300 }, (_, i) =>
      expenseWithTimestamp(`e-${i}`, i)
    );

    const pool = expensesForTemplateSelection(expenses);

    expect(pool).toHaveLength(250);
    expect(pool.map((e) => e.editedTimestamp)).toEqual(
      Array.from({ length: 250 }, (_, i) => 299 - i)
    );
  });

  it("at 251 expenses excludes only the oldest by editedTimestamp", () => {
    const expenses = Array.from({ length: 251 }, (_, i) =>
      expenseWithTimestamp(`e-${i}`, i)
    );

    const pool = expensesForTemplateSelection(expenses);

    expect(pool).toHaveLength(250);
    expect(pool.some((e) => e.id === "e-0")).toBe(false);
    expect(pool.some((e) => e.id === "e-250")).toBe(true);
  });
});
