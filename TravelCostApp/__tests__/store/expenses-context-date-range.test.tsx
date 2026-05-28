import React, { useContext, useEffect, useRef } from "react";
import { render, waitFor } from "@testing-library/react-native";

import ExpensesContextProvider, {
  ExpensesContext,
} from "../../store/expenses-context";
import { makeExpense } from "../fixtures/expense";
import type { ExpenseData } from "../../util/expense";

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: {
    EXPENSES: "expenses",
  },
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
}));

function MonthRangeProbe({
  expenses,
  at,
  onResult,
}: {
  expenses: ExpenseData[];
  at: Date;
  onResult: (result: ExpenseData[]) => void;
}) {
  const ctx = useContext(ExpensesContext);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    ctx.setExpenses(expenses);
  }, [ctx, expenses]);

  useEffect(() => {
    if (ctx.expenses.length === 0) return;
    onResult(ctx.getSpecificMonthExpenses(at));
  }, [at, ctx, onResult]);

  return null;
}

describe("ExpensesContext date-range helpers", () => {
  it("getSpecificMonthExpenses includes month endpoints and excludes adjacent months", async () => {
    // Use local Date parts: lastDay is midnight on the last calendar day, so
    // in-month expenses on that day must be at or before that instant.
    const at = new Date(2026, 2, 15);
    const eFeb = makeExpense({
      id: "feb-28",
      date: new Date(2026, 1, 28, 12, 0, 0),
    });
    const eMarStart = makeExpense({
      id: "mar-01",
      date: new Date(2026, 2, 1, 12, 0, 0),
    });
    const eMarEnd = makeExpense({
      id: "mar-31",
      date: new Date(2026, 2, 31, 0, 0, 0),
    });
    const eApr = makeExpense({
      id: "apr-01",
      date: new Date(2026, 3, 1, 12, 0, 0),
    });

    const result: { current: ExpenseData[] | null } = { current: null };

    render(
      <ExpensesContextProvider>
        <MonthRangeProbe
          expenses={[eFeb, eMarStart, eMarEnd, eApr]}
          at={at}
          onResult={(r) => {
            result.current = r;
          }}
        />
      </ExpensesContextProvider>
    );

    await waitFor(() => expect(result.current).not.toBeNull());
    const ids = (result.current ?? []).map((e) => e.id).sort();

    expect(ids).toEqual(["mar-01", "mar-31"]);
  });
});

