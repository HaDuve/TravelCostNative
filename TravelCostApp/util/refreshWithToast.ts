import Toast from "react-native-toast-message";
import { fetchAndSetExpenses } from "../components/ExpensesOutput/RecentExpensesUtil";

import { i18n } from "../i18n/i18n";
import { ExpenseContextType } from "../store/expenses-context";
import { TripContextType } from "../store/trip-context";

export interface RefreshWithToastParams {
  showRefIndicator: boolean;
  showAnyIndicator: boolean;
  setIsFetching: (isFetching: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  expensesCtx: ExpenseContextType;
  tripid: string;
  uid: string;
  tripCtx: TripContextType;
}

export async function refreshWithToast({
  showRefIndicator,
  showAnyIndicator,
  setIsFetching,
  setRefreshing,
  expensesCtx,
  tripid,
  uid,
  tripCtx,
}: RefreshWithToastParams): Promise<void> {
  // Store the count of expenses before refresh
  const expensesCountBefore = expensesCtx.expenses.length;

  try {
    // Call fetchAndSetExpenses but don't let it control the loading states
    await fetchAndSetExpenses(
      showRefIndicator,
      showAnyIndicator,
      setIsFetching,
      setRefreshing,
      expensesCtx as ExpenseContextType,
      tripid,
      uid,
      tripCtx as TripContextType
    );

    // Calculate how many new expenses were synced
    const expensesCountAfter = expensesCtx.expenses.length;
    const newExpensesCount = expensesCountAfter - expensesCountBefore;

    // Show appropriate success toast
    if (newExpensesCount === 0) {
      Toast.show({
        type: "success",
        text1: i18n.t("toastSyncSuccessTitle"),
        text2: i18n.t("toastSyncSuccessUpToDate"),
        position: "bottom",
      });
    } else {
      Toast.show({
        type: "success",
        text1: i18n.t("toastSyncSuccessTitle"),
        text2: `${i18n.t("toastSyncSuccessWithCount")} ${newExpensesCount} ${i18n.t("toastSyncSuccessExpenses")}`,
        position: "bottom",
      });
    }
  } catch (error) {
    // Show error toast
    Toast.show({
      type: "error",
      text1: i18n.t("toastSyncFailedTitle"),
      text2: i18n.t("toastSyncFailed"),
      position: "bottom",
    });

    // Re-throw the error so the calling component can handle it
    throw error;
  }
}
