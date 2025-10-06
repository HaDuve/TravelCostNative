import { getAllExpenses, unTouchTraveler } from "../../util/http";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import uniqBy from "lodash.uniqby";

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { ExpenseContextType } from "../../store/expenses-context";
import { TripContextType } from "../../store/trip-context";
import safeLogError from "../../util/error";
import { getExpensesSum } from "../../util/expense";

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
  if (!showRefIndicator && !showAnyIndicator) setIsFetching(true);
  if (!showAnyIndicator) setRefreshing(true);
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
    expenses = expenses.filter(expense => !isNaN(Number(expense.calcAmount)));

    if (expenses && expenses?.length !== 0) {
      // Use mergeExpenses instead of setExpenses to properly merge new expenses with existing ones
      expensesCtx.mergeExpenses(expenses);

      // Calculate the total sum from all current expenses plus new ones
      // This gives us the correct total for immediate display
      const currentExpenses = expensesCtx.expenses;
      const allExpenses = [...currentExpenses, ...expenses];
      const uniqueExpenses = uniqBy(allExpenses, "id");
      const expensesSum = getExpensesSum(uniqueExpenses);
      tripCtx.setTotalSum(expensesSum);

      // Note: The merged expenses will be automatically saved to storage
      // via the useEffect in expenses-context.tsx that watches expensesState changes
    }
  } catch (error) {
    safeLogError(error);
    // Ensure sync state is reset on error
    expensesCtx.setIsSyncing(false);
  }
  if (!showRefIndicator && !showAnyIndicator) setIsFetching(false);
  if (!showAnyIndicator) setRefreshing(false);
}

export function getDateRangeExpenses(startDate, endDate, expenses) {
  const rangeExpenses = expenses.filter(expense => {
    return expense.date >= startDate && expense.date <= endDate;
  });
  return rangeExpenses;
}
