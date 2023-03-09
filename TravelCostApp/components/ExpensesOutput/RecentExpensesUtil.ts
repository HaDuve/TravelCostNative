import { getAllExpenses, unTouchTraveler } from "../../util/http";
import Toast from "react-native-toast-message";

export async function offlineLoad(
  expensesCtx,
  setRefreshing = (b) => {
    return;
  },
  setIsFetching = (b) => {
    return;
  }
) {
  const isLoaded = await expensesCtx.loadExpensesFromStorage();
  setRefreshing(false);
  setIsFetching(false);
  return isLoaded;
}

export async function fetchAndSetExpenses(
  showRefIndicator: () => boolean,
  showAnyIndicator: () => boolean,
  setIsFetching: (isFetching: boolean) => void,
  setRefreshing: (isRefreshing: boolean) => void,
  expensesCtx: any,
  tripid: string,
  uid: string,
  tripCtx: any
) {
  console.log("fetchAndSetExpenses called");
  if (!showRefIndicator && !showAnyIndicator) setIsFetching(true);
  if (!showAnyIndicator) setRefreshing(true);
  try {
    const expenses = await getAllExpenses(tripid, uid);
    if (expenses && expenses.length !== 0) {
      expensesCtx.setExpenses(expenses);

      const expensesSum = expenses.reduce((sum, expense) => {
        return sum + expense.calcAmount;
      }, 0);
      tripCtx.setTotalSum(expensesSum);

      await expensesCtx.saveExpensesInStorage(expenses);
      await unTouchTraveler(tripid, uid);
    }
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Could not fetch trip data",
      visibilityTime: 1000,
    });
    console.error(error);
  }
  if (!showRefIndicator && !showAnyIndicator) setIsFetching(false);
  if (!showAnyIndicator) setRefreshing(false);
}
