import { getAllExpenses, unTouchTraveler } from "../../util/http";

import { i18n } from "../../i18n/i18n";

import { getExpensesSum } from "../../util/expense";
import {
  ExpenseContextType,
  mergeExpenseLists,
} from "../../store/expenses-context";
import { TripContextType } from "../../store/trip-context";
import safeLogError from "../../util/error";

export async function fetchAndSetExpenses(
  showRefIndicator: boolean,
  showAnyIndicator: boolean,
  setIsFetching: (isFetching: boolean) => void,
  setRefreshing: (isRefreshing: boolean) => void,
  expensesCtx: ExpenseContextType,
  tripid: string,
  uid: string,
  tripCtx: TripContextType
) {
  if (showRefIndicator && showAnyIndicator) setIsFetching(true);
  if (showAnyIndicator) setRefreshing(true);
  try {
    await unTouchTraveler(tripid, uid);

    // Use delta sync by default (true = useDelta)
    // Create sync loading callback
    const syncLoadingCallback = {
      onStart: () => {
        expensesCtx.setIsSyncing(true);
      },
      onComplete: () => {
        expensesCtx.setIsSyncing(false);
      },
    };

    let expenses = await getAllExpenses(tripid, uid, true, syncLoadingCallback);
    expenses = expenses.filter((expense) => !isNaN(Number(expense.calcAmount)));

    if (expenses && expenses?.length !== 0) {
      const mergedForSum = mergeExpenseLists(expensesCtx.expenses, expenses);
      expensesCtx.mergeExpenses(expenses);
      const expensesSum = getExpensesSum(mergedForSum);
      tripCtx.setTotalSum(expensesSum);

      // Note: The merged expenses will be automatically saved to storage
      // via the useEffect in expenses-context.tsx that watches expensesState changes
    }
  } catch (error) {
    safeLogError(error);
    // Ensure sync state is reset on error
    expensesCtx.setIsSyncing(false);
  }
  if (showRefIndicator && showAnyIndicator) setIsFetching(false);
  if (showAnyIndicator) setRefreshing(false);
}

export function getDateRangeExpenses(startDate, endDate, expenses) {
  const rangeExpenses = expenses.filter((expense) => {
    return expense.date >= startDate && expense.date <= endDate;
  });
  return rangeExpenses;
}
