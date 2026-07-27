import * as React from "react";
import { FlatList, Platform, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import PropTypes from "prop-types";
import uniqBy from "lodash.uniqby";
import { useCallback, useContext, useRef } from "react";

import TripHistoryItem from "./TripHistoryItem";
import TripSwipeLeaveAction from "./TripSwipeLeaveAction";
import LoadingOverlay from "../UI/LoadingOverlay";
import { TripContext, TripData } from "../../store/trip-context";
import { OrientationContext } from "../../store/orientation-context";
import { NetworkContext } from "../../store/network-context";
import { AuthContext } from "../../store/auth-context";
import { UserContext } from "../../store/user-context";
import { ExpensesContext } from "../../store/expenses-context";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { promptLeaveTrip } from "../../util/prompt-leave-trip";
import { resolveLeaverOpenBalances } from "../../util/leave-trip";
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
import { i18n } from "../../i18n/i18n";
import safeLogError from "../../util/error";

function TripList({ trips }) {
  const { isLandscape } = useContext(OrientationContext);
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

      Toast.show({
        type: "loading",
        text1: i18n.t("toastSaving1"),
        text2: i18n.t("toastSaving2"),
        autoHide: false,
      });

      try {
        const roster = await getTravellers(tripid);
        const openBalances = await resolveLeaverOpenBalances(
          tripid,
          uid,
          roster,
          openBalancesDeps()
        );
        const result = await tripCtx.leaveTrip(tripid, {
          uid,
          tripHistory: userCtx.tripHistory ?? [],
          getTravellers,
          openBalances,
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

        if (!result.performed) {
          Toast.hide();
          Toast.show({
            text1: i18n.t("toastSavingError1"),
            text2: i18n.t("error2"),
            type: "error",
          });
        }
        // Plain leave: leaveTrip shows Undo toast. Cascade-delete: no Undo.
      } catch (error) {
        safeLogError(error);
        Toast.hide();
        Toast.show({
          text1: i18n.t("toastSavingError1"),
          text2: i18n.t("error2"),
          type: "error",
        });
      }
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

  if (!trips || trips?.length < 1) return <LoadingOverlay></LoadingOverlay>;

  const uniqTrips: TripData[] = uniqBy(trips);

  function renderTripItem(itemData) {
    if (!itemData || !itemData.item) return <></>;
    if (!(typeof itemData.item === "string" || itemData.item instanceof String)) {
      return <></>;
    }
    const tripid = itemData.item as string;
    const index = itemData.index;
    const card = <TripHistoryItem {...{ tripid, trips }} />;

    if (!canLeave) {
      return card;
    }

    const leaveAction = () => (
      <TripSwipeLeaveAction onPress={() => void onLeavePress(tripid)} />
    );

    if (Platform.OS === "android") {
      return (
        <GestureHandlerRootView>
          <Swipeable
            renderLeftActions={leaveAction}
            onSwipeableOpen={() => closeRow(index)}
            ref={(ref) => {
              row[index] = ref;
            }}
            overshootFriction={8}
          >
            {card}
          </Swipeable>
        </GestureHandlerRootView>
      );
    }

    return (
      <Swipeable
        renderRightActions={leaveAction}
        onSwipeableOpen={() => closeRow(index)}
        ref={(ref) => {
          row[index] = ref;
        }}
        overshootFriction={8}
      >
        {card}
      </Swipeable>
    );
  }

  return (
    <View
      testID="trip-list-wrapper"
      style={{
        flex: 1,
        minHeight: dynamicScale(120, true),
      }}
    >
      <FlatList
        data={uniqTrips}
        scrollEnabled={true}
        horizontal={isLandscape}
        style={{ flex: 1 }}
        ListFooterComponent={
          <View style={{ height: constantScale(150), width: "100%" }}></View>
        }
        renderItem={renderTripItem}
        keyExtractor={(item: TripData) => {
          if (typeof item === "string" || item instanceof String)
            return item as string;
          return item.tripid + item.tripName;
        }}
      />
    </View>
  );
}

export default TripList;

TripList.propTypes = {
  trips: PropTypes.array,
  refreshControl: PropTypes.object,
  setRefreshing: PropTypes.func,
};
