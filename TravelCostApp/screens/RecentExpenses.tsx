import React, { useContext, useEffect, useMemo, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext, RangeString } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { toShortFormat } from "../util/date";
import {
  dataResponseTime,
  fetchTravelerIsTouched,
  getAllExpenses,
  unTouchTraveler,
} from "../util/http";

import {
  StyleSheet,
  Text,
  View,
  RefreshControl,
  LogBox,
  AppState,
} from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import AddExpenseButton from "../components/ManageExpense/AddExpenseButton";
import { DateTime } from "luxon";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
import { fetchAndSetExpenses } from "../components/ExpensesOutput/RecentExpensesUtil";
import { asyncStoreGetObject, asyncStoreSetItem } from "../store/async-storage";
import { _toShortFormat } from "../util/dateTime";
import { useFocusEffect } from "@react-navigation/native";
import { isForeground } from "../util/appState";
import { TourGuideZone } from "rn-tourguide";
import PropTypes from "prop-types";
import { ExpenseData } from "../util/expense";
import Toast from "react-native-toast-message";
import { NetworkContext } from "../store/network-context";
import { isConnectionFastEnough } from "../util/connectionSpeed";
import { sendOfflineQueue } from "../util/offline-queue";
import uniqBy from "lodash.uniqby";
import * as Haptics from "expo-haptics";

function RecentExpenses({ navigation }) {
  // console.log("rerender RecentExpenses - A");
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected && netCtx.strongConnection;

  const tripid = tripCtx.tripid;
  // uid as a state
  const [uid, setuidString] = useState(authCtx.uid);
  useEffect(() => {
    setuidString(authCtx.uid);
  }, [authCtx.uid]);

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState();

  const [open, setOpen] = useState(false);
  const [PeriodValue, setPeriodValue] = useState<RangeString>(RangeString.day);
  userCtx.setPeriodString(PeriodValue);

  const [dateTimeString, setDateTimeString] = useState("");

  const test_getExpenses = dataResponseTime(getExpenses);
  const test_offlineLoad = dataResponseTime(
    expensesCtx.loadExpensesFromStorage
  );
  const test_fetchTravelerIsTouched = dataResponseTime(fetchTravelerIsTouched);
  const test_fetchAndSetExpenses = dataResponseTime(fetchAndSetExpenses);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = test_getExpenses.bind(this, true);

  // strong connection state
  const [offlineString, setOfflineString] = useState("");
  // set in useEffect
  useEffect(() => {
    if (isOnline) {
      setOfflineString("");
    } else {
      if (netCtx.isConnected && !netCtx.strongConnection) {
        setOfflineString(" - Slow Connection");
      } else setOfflineString(" - Offline Mode");
    }
  }, [isOnline, netCtx.isConnected, netCtx.strongConnection]);

  useEffect(() => {
    const asyncLoading = async () => {
      await expensesCtx.loadExpensesFromStorage();
    };
    asyncLoading();
    if (netCtx.isConnected && netCtx.strongConnection) {
      test_getExpenses();
    }
  }, [netCtx.isConnected, netCtx.strongConnection]);

  useEffect(() => {
    async function setTravellers() {
      if (netCtx.isConnected && netCtx.strongConnection) {
        if (tripCtx.travellers && tripCtx.travellers.length > 1) return;
        try {
          await tripCtx.setCurrentTravellers(tripCtx.tripid);
        } catch (error) {
          console.log("error loading travellers in expenseForm");
        }
      } else {
        await tripCtx.loadTravellersFromStorage();
      }
    }
    setTravellers();
  }, [tripCtx.tripid, netCtx.isConnected, netCtx.strongConnection]);

  useEffect(() => {
    LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);
  }, []);

  useInterval(
    () => {
      setDateTimeString(_toShortFormat(DateTime.now()));
      if (isForeground()) {
        const asyncPolling = async () => {
          await getExpenses(true, true);
        };
        asyncPolling();
      }
    },
    DEBUG_POLLING_INTERVAL,
    true
  );

  const [items, setItems] = useState([
    { label: i18n.t("todayLabel"), value: RangeString.day },
    { label: i18n.t("weekLabel"), value: RangeString.week },
    { label: i18n.t("monthLabel"), value: RangeString.month },
    { label: i18n.t("yearLabel"), value: RangeString.year },
    { label: i18n.t("totalLabel"), value: RangeString.total },
  ]);

  async function getExpenses(
    showRefIndicator = false,
    showAnyIndicator = false
  ) {
    // check offlinemode
    const online = netCtx.isConnected && netCtx.strongConnection;
    const { isFastEnough, speed } = await isConnectionFastEnough();
    const offlineQueue = await asyncStoreGetObject("offlineQueue");
    const offlineQueueNonEmpty = offlineQueue && offlineQueue.length > 0;
    if (!online || !isFastEnough || offlineQueueNonEmpty) {
      if (online && isFastEnough) {
        console.log("RecentExpenses ~ sending offline queue");
        await sendOfflineQueue();
        return;
      }
      // setIsFetching(true);
      await test_offlineLoad(expensesCtx, setRefreshing, setIsFetching);
      // setIsFetching(false);
      return;
    }
    // checking isTouched or firstLoad
    const isTouched = await fetchTravelerIsTouched(tripid, uid);
    // console.log("RecentExpenses ~ isTouched:", isTouched);
    if (!isTouched) {
      setRefreshing(false);
      setIsFetching(false);
      return;
    }
    console.log("we are touched and fetching expenses");
    // fetch and set expenses

    await fetchAndSetExpenses(
      showRefIndicator,
      showAnyIndicator,
      setIsFetching,
      setRefreshing,
      expensesCtx,
      tripid,
      uid,
      tripCtx
    );
  }

  function errorHandler() {
    setError(null);
  }
  const recentExpenses: Array<ExpenseData> = useMemo(
    () => uniqBy(expensesCtx.getRecentExpenses(PeriodValue), "id"),
    [PeriodValue, expensesCtx.expenses]
  );

  if (error && !isFetching) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }
  // if (isFetching) {
  //   return <LoadingOverlay />;
  // }

  return (
    <View style={styles.container}>
      <TourGuideZone
        text={i18n.t("walk1")}
        zone={1}
        maskOffset={-4}
        tooltipBottomOffset={200}
      ></TourGuideZone>
      <TourGuideZone
        text={i18n.t("walk8")}
        zone={8}
        maskOffset={-4}
        tooltipBottomOffset={-200}
      ></TourGuideZone>
      <TourGuideZone
        text={i18n.t("walk3")}
        maskOffset={200}
        tooltipBottomOffset={-200}
        zone={3}
      ></TourGuideZone>
      <View style={styles.dateHeader}>
        <Text style={styles.dateString}>
          {dateTimeString}
          {offlineString}
        </Text>
      </View>

      <View style={styles.header}>
        <DropDownPicker
          open={open}
          value={PeriodValue}
          items={items}
          setOpen={setOpen}
          onOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onClose={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onSelectItem={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          setValue={setPeriodValue}
          setItems={setItems}
          containerStyle={styles.dropdownContainer}
          style={styles.dropdown}
          textStyle={styles.dropdownTextStyle}
        />

        <ExpensesSummary expenses={recentExpenses} periodName={PeriodValue} />
      </View>

      <View style={styles.tempGrayBar1}></View>

      <ExpensesOutput
        expenses={recentExpenses}
        periodValue={PeriodValue}
        fallbackText={i18n.t("fallbackTextExpenses")}
        // refreshControl={
        //   <RefreshControl
        //     refreshing={refreshing}
        //     onRefresh={
        //       isOnline
        //         ? onRefresh
        //         : () => {
        //             return;
        //           }
        //     }
        //   />
        // }
      />

      <AddExpenseButton navigation={navigation} />
    </View>
  );
}

export default RecentExpenses;
RecentExpenses.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    justifyContent: "flex-start",
  },
  dateHeader: {
    marginVertical: "4%",
    marginLeft: "6%",
    marginBottom: "-6%",
  },
  dateString: {
    fontSize: 12,
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: "6%",
    marginHorizontal: "4%",
    marginBottom: "4%",
    zIndex: 10,
  },
  dropdownContainer: {
    maxWidth: "50%",
    marginTop: "2%",
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 0,
  },
  dropdownTextStyle: {
    fontSize: i18n.locale == "fr" ? 20 : 34,
    fontWeight: "bold",
  },
  zBehind: {
    zIndex: 10,
  },
  tempGrayBar1: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderBottomColor: GlobalStyles.colors.gray600,
    minHeight: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 2,
  },
});
