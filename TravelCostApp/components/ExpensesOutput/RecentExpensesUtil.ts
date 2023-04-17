import { getAllExpenses, unTouchTraveler } from "../../util/http";
import Toast from "react-native-toast-message";
import { asyncStoreSetObject } from "../../store/async-storage";

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
    let expenses = await getAllExpenses(tripid, uid);
    expenses = expenses.filter((expense) => !isNaN(Number(expense.calcAmount)));
    if (expenses && expenses.length !== 0) {
      expensesCtx.setExpenses(expenses);

      const expensesSum = expenses.reduce((sum, expense) => {
        if (expense.iconName)
          console.log("expense iconName: " + expense.iconName);
        return sum + expense.calcAmount;
      }, 0);
      tripCtx.setTotalSum(expensesSum);

      await asyncStoreSetObject("expenses", expenses);
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
