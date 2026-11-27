import { RangeString } from "../../store/expenses-context";
import {
  ExpenseListEntry,
  formatRangedExpenseDateRange,
  groupExpensesForList,
} from "../../util/expense-list-sections";
import { makeExpense } from "../fixtures/expense";

function at(y: number, m: number, d: number, h = 12, min = 0): Date {
  return new Date(y, m - 1, d, h, min);
}

function outline(entries: ExpenseListEntry[]): string[] {
  return entries.map((e) =>
    e.kind === "header" ? `# ${e.label}` : e.expense.id,
  );
}

describe("formatRangedExpenseDateRange", () => {
  it("omits the year within the same year", () => {
    const expense = makeExpense({
      rangeId: "r1",
      startDate: at(2026, 11, 20),
      endDate: at(2026, 12, 3),
    });
    expect(formatRangedExpenseDateRange(expense)).toBe("20.11 – 03.12");
  });

  it("shows the years across a year boundary", () => {
    const expense = makeExpense({
      rangeId: "r1",
      startDate: at(2026, 12, 28),
      endDate: at(2027, 1, 4),
    });
    expect(formatRangedExpenseDateRange(expense)).toBe("28.12.26 – 04.01.27");
  });

  it("is empty for an Expense that is not part of a Ranged expense", () => {
    const expense = makeExpense({
      startDate: at(2026, 11, 20),
      endDate: at(2026, 12, 3),
    });
    expect(formatRangedExpenseDateRange(expense)).toBe("");
  });
});

describe("groupExpensesForList (day period, Ranged expenses)", () => {
  const now = at(2026, 11, 27, 15, 0);

  it("puts Ranged expense days in a trailing Multi-day expenses group, midnight Expenses stay under Today", () => {
    const expenses = [
      makeExpense({
        id: "ranged",
        rangeId: "r1",
        date: at(2026, 11, 27, 16, 0),
      }),
      makeExpense({ id: "midnight", date: at(2026, 11, 27, 0, 0) }),
      makeExpense({ id: "lunch", date: at(2026, 11, 27, 12, 0) }),
    ];
    const entries = groupExpensesForList(expenses, RangeString.day, now, "en");
    expect(outline(entries)).toEqual([
      "# Midday",
      "lunch",
      "# Today",
      "midnight",
      "# Multi-day expenses",
      "ranged",
    ]);
  });
});
