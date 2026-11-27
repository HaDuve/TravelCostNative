import { act, renderHook } from "@testing-library/react-native";

const mockFocusListeners = new Set<() => void>();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    addListener: (event: string, listener: () => void) => {
      if (event === "focus") mockFocusListeners.add(listener);
      return () => mockFocusListeners.delete(listener);
    },
  }),
}));

import { useExpenseListEntries } from "../../hooks/useExpenseListEntries";
import { i18n } from "../../i18n/i18n";
import { addShadowItemsToExpenses } from "../../components/ExpensesOutput/ExpenseListUtil";
import { ExpenseListEntry } from "../../util/expense-list-sections";
import { makeExpense } from "../fixtures/expense";

function at(month: number, day: number, hour: number, minute = 0): Date {
  return new Date(2026, month - 1, day, hour, minute);
}

function expenseOn(id: string, date: Date) {
  return makeExpense({ id, date, startDate: date, endDate: date });
}

function outline(entries: ExpenseListEntry[]): string[] {
  return entries.map((entry) =>
    entry.kind === "dayHeader" ? `# ${entry.label}` : entry.key,
  );
}

describe("useExpenseListEntries", () => {
  const originalLocale = i18n.locale;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(at(11, 27, 15, 0));
    i18n.locale = "en";
  });
  afterEach(() => {
    i18n.locale = originalLocale;
    jest.useRealTimers();
  });

  it("groups the Expenses for the period and puts the shadow rows last, without a header", () => {
    const expenses = [
      expenseOn("dinner", at(11, 26, 20, 0)),
      expenseOn("lunch", at(11, 27, 13, 0)),
    ];
    addShadowItemsToExpenses(expenses);

    const { result } = renderHook(() =>
      useExpenseListEntries(expenses, "week"),
    );

    const lines = outline(result.current);
    expect(lines.slice(0, 4)).toEqual([
      "# Today",
      "lunch",
      "# Yesterday",
      "dinner",
    ]);
    expect(lines.slice(4).every((line) => line.startsWith("shadow"))).toBe(
      true,
    );
    expect(lines.length).toBeGreaterThan(4);
  });

  it("relabels the headers when the app language changes", () => {
    const expenses = [expenseOn("lunch", at(11, 27, 13, 0))];
    const { result, rerender } = renderHook(() =>
      useExpenseListEntries(expenses, "week"),
    );
    expect(outline(result.current)[0]).toBe("# Today");

    i18n.locale = "de";
    rerender({});

    expect(outline(result.current)[0]).toBe("# Heute");
  });

  it("refreshes Just now when the screen regains focus", () => {
    const expenses = [expenseOn("snack", at(11, 27, 14, 30))];
    const { result } = renderHook(() => useExpenseListEntries(expenses, "day"));
    expect(outline(result.current)[0]).toBe("# Just now");

    jest.setSystemTime(at(11, 27, 16, 10));
    act(() => {
      mockFocusListeners.forEach((listener) => listener());
    });

    expect(outline(result.current)[0]).toBe("# This afternoon");
  });
});
