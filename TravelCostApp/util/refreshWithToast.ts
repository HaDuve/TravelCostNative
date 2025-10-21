import Toast from "react-native-toast-message";
import { fetchAndSetExpenses } from "../components/ExpensesOutput/RecentExpensesUtil";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

export interface RefreshWithToastParams {
  showRefIndicator: boolean;
  showAnyIndicator: boolean;
  setIsFetching: (isFetching: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  expensesCtx: {
    expenses: any[];
    mergeExpenses: (expenses: any[]) => void;
  };
  tripid: string;
  uid: string;
  tripCtx: {
    setTotalSum: (sum: number) => void;
  };
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
      true, // showRefIndicator = true (don't control isFetching)
      true, // showAnyIndicator = true (don't control refreshing)
      setIsFetching,
      setRefreshing,
      expensesCtx,
      tripid,
      uid,
      tripCtx
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
  } finally {
    // Turn off loading indicators AFTER toast is shown
    if (!showRefIndicator && !showAnyIndicator) setIsFetching(false);
    if (!showAnyIndicator) setRefreshing(false);
  }
}
