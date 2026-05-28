import { useContext, useMemo } from "react";

import { ExpensesContext } from "../store/expenses-context";
import { sumForTrip } from "../util/expenseTotals";

export function useTripTotalSpent(): number {
  const { expenses } = useContext(ExpensesContext);
  return useMemo(() => sumForTrip(expenses), [expenses]);
}

