import React, { useContext, useEffect } from "react";
import { render } from "@testing-library/react-native";

import ExpensesContextProvider, {
  ExpensesContext,
} from "../../store/expenses-context";
import type { ExpenseContextType } from "../../store/expenses-context";

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: {
    EXPENSES: "expenses",
  },
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
}));

function ValueSpy({ onValue }: { onValue: (value: unknown) => void }) {
  const value = useContext(ExpensesContext);

  useEffect(() => {
    onValue(value);
  }, [onValue, value]);

  return null;
}

function TestHarness({
  seed,
  onValue,
}: {
  seed: number;
  onValue: (value: unknown) => void;
}) {
  // `seed` is intentionally unused by the provider; it only forces a re-render.
  return (
    <ExpensesContextProvider>
      <ValueSpy
        onValue={(v) => {
          // ensure we record a value per re-render even when `v` is stable
          seed;
          onValue(v);
        }}
      />
    </ExpensesContextProvider>
  );
}

describe("ExpensesContextProvider memoization", () => {
  it("keeps selected provider fields stable across unrelated re-renders", () => {
    const seen: ExpenseContextType[] = [];
    const onValue = (value: unknown) => {
      seen.push(value as ExpenseContextType);
    };

    const { rerender } = render(<TestHarness seed={1} onValue={onValue} />);
    rerender(<TestHarness seed={2} onValue={onValue} />);

    expect(seen.length).toBeGreaterThanOrEqual(2);

    // Stable wrapper + stable contents we care about (regression guard).
    expect(seen[0]).toBe(seen[1]);
    expect(seen[0].expenses).toBe(seen[1].expenses);
    expect(seen[0].addExpense).toBe(seen[1].addExpense);
    expect(seen[0].setExpenses).toBe(seen[1].setExpenses);
    expect(seen[0].mergeExpenses).toBe(seen[1].mergeExpenses);
    expect(seen[0].deleteExpense).toBe(seen[1].deleteExpense);
    expect(seen[0].updateExpense).toBe(seen[1].updateExpense);
    expect(seen[0].updateExpenseId).toBe(seen[1].updateExpenseId);
    expect(seen[0].getRecentExpenses).toBe(seen[1].getRecentExpenses);
    expect(seen[0].getSpecificMonthExpenses).toBe(
      seen[1].getSpecificMonthExpenses
    );
    expect(seen[0].loadExpensesFromStorage).toBe(seen[1].loadExpensesFromStorage);
  });
});

