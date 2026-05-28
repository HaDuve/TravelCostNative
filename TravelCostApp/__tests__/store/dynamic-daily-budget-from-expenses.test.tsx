import React, { useContext, useEffect, useRef } from "react";
import { Text } from "react-native";
import { render, waitFor } from "@testing-library/react-native";

import TripContextProvider, { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";
import { makeExpense } from "../fixtures/expense";

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => null),
}));

function BudgetProbe() {
  const tripCtx = useContext(TripContext);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      await tripCtx.setCurrentTrip("trip-1", {
        tripName: "Test Trip",
        totalBudget: "100",
        dailyBudget: "0",
        tripCurrency: "EUR",
        startDate: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        endDate: new Date("2026-01-11T00:00:00.000Z").toISOString(),
        travellers: [],
        isDynamicDailyBudget: true,
        totalSum: 0,
      });
    })();
  }, [tripCtx.setCurrentTrip]);

  return <Text testID="dailyBudget">{String(tripCtx.dailyBudget)}</Text>;
}

describe("TripContext dynamic daily budget", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("recomputes from expenses-derived trip total spent", async () => {
    const initialExpenses = [
      makeExpense({ id: "e1", calcAmount: 20, splitList: [] }),
      makeExpense({ id: "e_deleted", calcAmount: 999, isDeleted: true, splitList: [] }),
    ];
    const updatedExpenses = [
      ...initialExpenses,
      makeExpense({ id: "e2", calcAmount: 30, splitList: [] }),
    ];

    const baseExpensesCtx = {
      isSyncing: false,
      addExpense: jest.fn(),
      setExpenses: jest.fn(),
      mergeExpenses: jest.fn(),
      deleteExpense: jest.fn(),
      updateExpense: jest.fn(),
      updateExpenseId: jest.fn(),
      getRecentExpenses: jest.fn(() => []),
      getYearlyExpenses: jest.fn(() => ({
        firstDay: new Date(),
        lastDay: new Date(),
        yearlyExpenses: [],
      })),
      getMonthlyExpenses: jest.fn(() => ({
        firstDay: new Date(),
        lastDay: new Date(),
        monthlyExpenses: [],
      })),
      getWeeklyExpenses: jest.fn(() => ({
        firstDay: new Date(),
        lastDay: new Date(),
        weeklyExpenses: [],
      })),
      getDailyExpenses: jest.fn(() => []),
      getSpecificDayExpenses: jest.fn(() => []),
      getSpecificWeekExpenses: jest.fn(() => []),
      getSpecificMonthExpenses: jest.fn(() => []),
      getSpecificYearExpenses: jest.fn(() => []),
      loadExpensesFromStorage: jest.fn(async () => true),
      setIsSyncing: jest.fn(),
    };

    const screen = render(
      <ExpensesContext.Provider value={{ ...baseExpensesCtx, expenses: initialExpenses } as any}>
        <TripContextProvider>
          <BudgetProbe />
        </TripContextProvider>
      </ExpensesContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("dailyBudget").props.children).toBe("8.00");
    });

    screen.rerender(
      <ExpensesContext.Provider value={{ ...baseExpensesCtx, expenses: updatedExpenses } as any}>
        <TripContextProvider>
          <BudgetProbe />
        </TripContextProvider>
      </ExpensesContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("dailyBudget").props.children).toBe("5.00");
    });
  });
});

