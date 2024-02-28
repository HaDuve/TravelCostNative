import { getAllExpenses, unTouchTraveler } from "../../util/http";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { setMMKVObject } from "../../store/mmkv";
import { getExpensesSum } from "../../util/expense";
import { ExpenseContextType } from "../../store/expenses-context";
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
  if (!showRefIndicator && !showAnyIndicator) setIsFetching(true);
  if (!showAnyIndicator) setRefreshing(true);
  try {
    await unTouchTraveler(tripid, uid);
    let expenses = await getAllExpenses(tripid, uid);
    expenses = expenses.filter((expense) => !isNaN(Number(expense.calcAmount)));
    if (expenses && expenses?.length !== 0) {
      expensesCtx.setExpenses(expenses);
      const expensesSum = getExpensesSum(expenses);
      tripCtx.setTotalSum(expensesSum);

      // await asyncStoreSetObject("expenses", expenses);
      setMMKVObject("expenses", expenses);
    }
  } catch (error) {
    safeLogError(error);
  }
  if (!showRefIndicator && !showAnyIndicator) setIsFetching(false);
  if (!showAnyIndicator) setRefreshing(false);
}

export function getDateRangeExpenses(startDate, endDate, expenses) {
  const rangeExpenses = expenses.filter((expense) => {
    return expense.date >= startDate && expense.date <= endDate;
  });
  return rangeExpenses;
}
