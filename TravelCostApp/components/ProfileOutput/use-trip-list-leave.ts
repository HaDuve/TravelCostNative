import { useCallback, useContext, useRef } from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { AuthContext } from "../../store/auth-context";
import { ExpensesContext } from "../../store/expenses-context";
import { NetworkContext } from "../../store/network-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import { performLeaveTripUi } from "../../util/perform-leave-trip-ui";
import { promptLeaveTrip } from "../../util/prompt-leave-trip";
import {
  fetchTrip,
  getAllExpenses,
  getTravellers,
  updateUser,
} from "../../util/http";
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../../store/secure-storage";
import { MMKV_KEYS, setMMKVObject } from "../../store/mmkv";

export function useTripListLeave(trips: string[]) {
  const { isConnected, strongConnection } = useContext(NetworkContext);
  const online = !!(isConnected && strongConnection);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const expenseCtx = useContext(ExpensesContext);
  const row = useRef<Record<number, Swipeable | null>>({}).current;
  const prevOpenedRow = useRef<Swipeable | null>(null);

  const canLeave = (userCtx.tripHistory?.length ?? trips?.length ?? 0) > 1;

  const forceCloseRow = useCallback(
    (index: number) => {
      row[index]?.close();
    },
    [row]
  );

  const closeRow = useCallback(
    (index: number) => {
      if (prevOpenedRow.current && prevOpenedRow.current !== row[index]) {
        prevOpenedRow.current.close();
      }
      prevOpenedRow.current = row[index];
      setTimeout(() => {
        forceCloseRow(index);
      }, 1500);
    },
    [forceCloseRow, row]
  );

  const openBalancesDeps = useCallback(
    () => ({
      activeTripId: tripCtx.tripid,
      activeExpenses: expenseCtx.expenses ?? [],
      activeTripCurrency: tripCtx.tripCurrency,
      activeIsPaidTimestamp: tripCtx.isPaidTimestamp,
      userNameFallback: userCtx.userName,
      getAllExpenses,
      fetchTrip,
    }),
    [
      expenseCtx.expenses,
      tripCtx.isPaidTimestamp,
      tripCtx.tripCurrency,
      tripCtx.tripid,
      userCtx.userName,
    ]
  );

  const performLeave = useCallback(
    async (tripid: string) => {
      const uid = authCtx.uid ?? (await secureStoreGetItem("uid"));
      if (!uid) return;

      await performLeaveTripUi({
        tripid,
        uid,
        tripHistory: userCtx.tripHistory ?? [],
        getTravellers,
        openBalancesDeps: openBalancesDeps(),
        leaveTrip: tripCtx.leaveTrip,
        removeFromTripHistoryLocal: userCtx.removeTripFromHistory,
        restoreTripHistoryLocal: userCtx.restoreTripHistory,
        activate: {
          previousTripSnapshot: tripCtx.getcurrentTrip(),
          previousExpensesSnapshot: expenseCtx.expenses,
          fetchTrip,
          getTravellers,
          getAllExpenses,
          updateUser,
          secureStoreGetItem,
          secureStoreSetItem,
          setCurrentTrip: tripCtx.setCurrentTrip,
          saveTripDataInStorage: tripCtx.saveTripDataInStorage,
          saveTravellersInStorage: tripCtx.saveTravellersInStorage,
          setExpenses: expenseCtx.setExpenses,
          setExpensesCache: (nextExpenses) =>
            setMMKVObject(MMKV_KEYS.EXPENSES, nextExpenses),
          setFreshlyCreatedTo: userCtx.setFreshlyCreatedTo,
        },
      });
    },
    [
      authCtx.uid,
      expenseCtx.expenses,
      expenseCtx.setExpenses,
      openBalancesDeps,
      tripCtx,
      userCtx.removeTripFromHistory,
      userCtx.restoreTripHistory,
      userCtx.setFreshlyCreatedTo,
      userCtx.tripHistory,
    ]
  );

  const onLeavePress = useCallback(
    async (tripid: string) => {
      const uid = authCtx.uid ?? (await secureStoreGetItem("uid"));
      if (!uid) return;
      await promptLeaveTrip({
        isConnected: online,
        tripid,
        uid,
        tripHistory: userCtx.tripHistory ?? trips ?? [],
        activeTripId: tripCtx.tripid,
        getTravellers,
        openBalancesDeps: openBalancesDeps(),
        onConfirm: () => {
          void performLeave(tripid);
        },
      });
    },
    [
      authCtx.uid,
      online,
      openBalancesDeps,
      performLeave,
      tripCtx.tripid,
      trips,
      userCtx.tripHistory,
    ]
  );

  return {
    canLeave,
    closeRow,
    onLeavePress,
    setRowRef: (index: number, ref: Swipeable | null) => {
      row[index] = ref;
    },
  };
}
