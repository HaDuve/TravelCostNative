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

function YearRangeProbe({
  expenses,
  yearsBack,
  onResult,
}: {
  expenses: ExpenseData[];
  yearsBack: number;
  onResult: (result: {
    firstDay: Date;
    lastDay: Date;
    yearlyExpenses: ExpenseData[];
  }) => void;
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
    onResult(ctx.getYearlyExpenses(yearsBack));
  }, [ctx, onResult, yearsBack]);

  return null;
}

function WeekRangeProbe({
  expenses,
  weeksBack,
  onResult,
}: {
  expenses: ExpenseData[];
  weeksBack: number;
  onResult: (result: {
    firstDay: Date;
    lastDay: Date;
    weeklyExpenses: ExpenseData[];
  }) => void;
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
    onResult(ctx.getWeeklyExpenses(weeksBack));
  }, [ctx, onResult, weeksBack]);

  return null;
}

describe("ExpensesContext date-range helpers", () => {
  it("getSpecificMonthExpenses includes month endpoints and excludes adjacent months", async () => {
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
      date: new Date(2026, 2, 31, 12, 0, 0),
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

  it("getYearlyExpenses returns calendar-year range for the current year", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 15, 12, 0, 0));

    const ePrevYear = makeExpense({
      id: "2025-12-31",
      date: new Date(2025, 11, 31, 0, 0, 0),
    });
    const eYearStart = makeExpense({
      id: "2026-01-01",
      date: new Date(2026, 0, 1, 0, 0, 0),
    });
    const eYearEnd = makeExpense({
      id: "2026-12-31",
      date: new Date(2026, 11, 31, 12, 0, 0),
    });
    const eNextYear = makeExpense({
      id: "2027-01-01",
      date: new Date(2027, 0, 1, 0, 0, 0),
    });

    const result: {
      current:
        | {
            firstDay: Date;
            lastDay: Date;
            yearlyExpenses: ExpenseData[];
          }
        | null;
    } = { current: null };

    render(
      <ExpensesContextProvider>
        <YearRangeProbe
          expenses={[ePrevYear, eYearStart, eYearEnd, eNextYear]}
          yearsBack={0}
          onResult={(r) => {
            result.current = r;
          }}
        />
      </ExpensesContextProvider>
    );

    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current?.firstDay).toEqual(new Date(2026, 0, 1));
    expect(result.current?.lastDay).toEqual(new Date(2026, 11, 31));

    const ids = (result.current?.yearlyExpenses ?? []).map((e) => e.id).sort();
    expect(ids).toEqual(["2026-01-01", "2026-12-31"]);

    jest.useRealTimers();
  });

  it("getWeeklyExpenses includes expenses on the last day of the week (not just midnight)", async () => {
    jest.useFakeTimers();
    // Wed, Mar 18 2026 => current week Monday=Mar 16, Sunday=Mar 22
    jest.setSystemTime(new Date(2026, 2, 18, 12, 0, 0));

    const eMon = makeExpense({
      id: "mon",
      date: new Date(2026, 2, 16, 12, 0, 0),
    });
    const eSunNoon = makeExpense({
      id: "sun-noon",
      date: new Date(2026, 2, 22, 12, 0, 0),
    });
    const eNextMon = makeExpense({
      id: "next-mon",
      date: new Date(2026, 2, 23, 12, 0, 0),
    });

    const result: {
      current:
        | {
            firstDay: Date;
            lastDay: Date;
            weeklyExpenses: ExpenseData[];
          }
        | null;
    } = { current: null };

    render(
      <ExpensesContextProvider>
        <WeekRangeProbe
          expenses={[eMon, eSunNoon, eNextMon]}
          weeksBack={0}
          onResult={(r) => {
            result.current = r;
          }}
        />
      </ExpensesContextProvider>
    );

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.firstDay).toEqual(new Date(2026, 2, 16));
    expect(result.current?.lastDay).toEqual(new Date(2026, 2, 22));

    const ids = (result.current?.weeklyExpenses ?? []).map((e) => e.id).sort();
    expect(ids).toEqual(["mon", "sun-noon"]);

    jest.useRealTimers();
  });

  it("getMonthlyExpenses uses calendar months (not an approximate 30-day offset)", async () => {
    jest.useFakeTimers();
    // March 31st is the classic failure for "monthsBack * 30 days":
    // 30 days back from Mar 31 => Mar 1 (wrong), but 1 calendar month back => Feb.
    jest.setSystemTime(new Date(2026, 2, 31, 12, 0, 0));

    const eFeb = makeExpense({
      id: "feb-28",
      date: new Date(2026, 1, 28, 12, 0, 0),
    });
    const eMar = makeExpense({
      id: "mar-01",
      date: new Date(2026, 2, 1, 12, 0, 0),
    });

    const result: {
      current:
        | {
            firstDay: Date;
            lastDay: Date;
            monthlyExpenses: ExpenseData[];
          }
        | null;
    } = { current: null };

    function MonthBackProbe({
      expenses,
      monthsBack,
      onResult,
    }: {
      expenses: ExpenseData[];
      monthsBack: number;
      onResult: (r: {
        firstDay: Date;
        lastDay: Date;
        monthlyExpenses: ExpenseData[];
      }) => void;
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
        onResult(ctx.getMonthlyExpenses(monthsBack));
      }, [ctx, monthsBack, onResult]);

      return null;
    }

    render(
      <ExpensesContextProvider>
        <MonthBackProbe
          expenses={[eFeb, eMar]}
          monthsBack={1}
          onResult={(r) => {
            result.current = r;
          }}
        />
      </ExpensesContextProvider>
    );

    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current?.firstDay).toEqual(new Date(2026, 1, 1));
    expect(result.current?.lastDay).toEqual(new Date(2026, 1, 28));

    const ids = (result.current?.monthlyExpenses ?? []).map((e) => e.id).sort();
    expect(ids).toEqual(["feb-28"]);

    jest.useRealTimers();
  });
});

