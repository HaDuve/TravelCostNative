import { useMemo } from "react";

import { isShadowExpense } from "../components/ExpensesOutput/ExpenseListUtil";
import { i18n } from "../i18n/i18n";
import type { ExpenseData } from "../util/expense";
import {
  ExpenseListEntry,
  groupExpensesForList,
} from "../util/expense-list-sections";
import { useRefreshOnReturn } from "./useRefreshOnReturn";

/**
 * Rows of the Expense list: section headers (day, time of day or month, by
 * period) and Expenses, followed by the blank shadow rows that pad short
 * lists. Labels such as "Just now" are recomputed when the user comes back
 * to the screen or the app, and when the app language changes.
 */
export function useExpenseListEntries(
  expenses: ExpenseData[],
  periodName: string,
): ExpenseListEntry[] {
  const returnsToScreen = useRefreshOnReturn();
  const locale = i18n.locale;
  return useMemo(() => {
    const shadowEntries: ExpenseListEntry[] = expenses
      .filter(isShadowExpense)
      .map((item) => ({
        kind: "expense",
        key: item.id,
        expense: item,
        underDayHeader: false,
      }));
    return [
      ...groupExpensesForList(
        expenses.filter((item) => !isShadowExpense(item)),
        periodName,
        new Date(),
        locale,
      ),
      ...shadowEntries,
    ];
    // expenses.length: shadow rows are pushed onto the same array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, expenses?.length, periodName, locale, returnsToScreen]);
}
