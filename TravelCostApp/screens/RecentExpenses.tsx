import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import DropDownPicker from "react-native-dropdown-picker";
import ExpensesOutput, {
  MemoizedExpensesOutput,
} from "../components/ExpensesOutput/ExpensesOutput";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext, RangeString } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { getOfflineQueue } from "../util/offline-queue";
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
  useWindowDimensions,
} from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import AddExpenseButton from "../components/ManageExpense/AddExpenseButton";
import { DateTime } from "luxon";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Config from "react-native-config";
import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
import { fetchAndSetExpenses } from "../components/ExpensesOutput/RecentExpensesUtil";
import { asyncStoreGetObject, asyncStoreSetItem } from "../store/async-storage";
import { _toShortFormat } from "../util/dateTime";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import { isForeground } from "../util/appState";
import { TourGuideZone } from "rn-tourguide";
import PropTypes from "prop-types";
import { ExpenseData } from "../util/expense";
import Toast from "react-native-toast-message";
import { NetworkContext } from "../store/network-context";
import { isConnectionFastEnough } from "../util/connectionSpeed";
import { sendOfflineQueue } from "../util/offline-queue";
import * as Haptics from "expo-haptics";
import { SettingsContext } from "../store/settings-context";
import { formatExpenseWithCurrency, truncateString } from "../util/string";
import { Platform } from "react-native";
import { REACT_APP_CAT_API_KEY, REACT_APP_GPT_API_KEY } from "@env";
import * as Device from "expo-device";
import { memo } from "react";
import { set } from "react-native-reanimated";

function RecentExpenses({ navigation }) {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected && netCtx.strongConnection;
  const { settings } = useContext(SettingsContext);
  const listRef = React.useRef(null);
  useScrollToTop(listRef);

  useFocusEffect(
    React.useCallback(() => {
      if (userCtx.freshlyCreated) {
        Toast.show({
          type: "success",
          text1: i18n.t("welcomeToBudgetForNomads"),
          text2: i18n.t("pleaseCreateTrip"),
        });
        navigation.navigate("Profile");
      }
    }, [userCtx.freshlyCreated, navigation])
  );

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
  useEffect(() => {
    userCtx.setPeriodString(PeriodValue);
  }, [PeriodValue, userCtx]);

  const [dateTimeString, setDateTimeString] = useState("");

  // const test_getExpenses = dataResponseTime(getExpenses);
  // const test_offlineLoad = dataResponseTime(
  //   expensesCtx.loadExpensesFromStorage
  // );
  // const test_fetchTravelerIsTouched = dataResponseTime(fetchTravelerIsTouched);
  // const test_fetchAndSetExpenses = dataResponseTime(fetchAndSetExpenses);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    console.log("refreshing: ", refreshing);
    setRefreshing(true);
    // check if we have a offline queue
    const offlineQueue = await getOfflineQueue();
    // if we have a offline queue return
    if (offlineQueue && offlineQueue.length > 0) {
      setRefreshing(false);
      return;
    }
    await getExpenses(true, true, true);
    setRefreshing(false);
  }, [getExpenses]);

  // strong connection state
  const [offlineString, setOfflineString] = useState("");
  const lastConnectionSpeedInMbps = netCtx.lastConnectionSpeedInMbps ?? 0;
  const showInternetSpeed = settings.showInternetSpeed;
  const connectionSpeedString = showInternetSpeed
    ? " - " +
      lastConnectionSpeedInMbps?.toFixed(2) +
      ` ${i18n.t("megaBytePerSecond")}`
    : "";
  // set in useEffect
  useEffect(() => {
    if (isOnline) {
      setOfflineString(connectionSpeedString);
    } else {
      if (netCtx.isConnected && !netCtx.strongConnection) {
        setOfflineString(`` + connectionSpeedString);
      } else setOfflineString(` - ${i18n.t("offlineMode")}`);
    }
  }, [
    isOnline,
    netCtx.isConnected,
    netCtx.strongConnection,
    connectionSpeedString,
  ]);

  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    const asyncLoading = async () => {
      // if expenses not empty, return
      if (
        !loadedOnce &&
        expensesCtx.expenses &&
        expensesCtx.expenses.length > 0
      ) {
        await getExpenses(true, true, true);
        setLoadedOnce(true);
      }
    };
    asyncLoading();
  }, [
    expensesCtx.expenses,
    getExpenses,
    loadedOnce,
    netCtx.isConnected,
    netCtx.strongConnection,
  ]);

  useEffect(() => {
    async function setTravellers() {
      if (netCtx.isConnected && netCtx.strongConnection) {
        if (tripCtx.travellers && tripCtx.travellers.length > 1) return;
        try {
          await tripCtx.fetchAndSetTravellers(tripCtx.tripid);
        } catch (error) {
          console.log("error loading travellers in expenseForm");
        }
      } else {
        await tripCtx.loadTravellersFromStorage();
      }
    }
    setTravellers();
  }, [tripCtx.tripid, netCtx.isConnected, netCtx.strongConnection]);

  const getExpenses = useCallback(
    async (
      showRefIndicator = false,
      showAnyIndicator = false,
      ignoreTouched = false
    ) => {
      if (userCtx.freshlyCreated) return;
      if (ignoreTouched)
        console.log("getExpenses ~ ignoreTouched:", ignoreTouched);
      // check offlinemode
      const online = netCtx.isConnected && netCtx.strongConnection;
      const offlineQueue = await asyncStoreGetObject("offlineQueue");
      const queueBlocked = offlineQueue && offlineQueue.length > 0;
      if (!online || queueBlocked) {
        // if online, send offline queue
        if (online) {
          console.log("RecentExpenses ~ sending offline queue");
          await sendOfflineQueue();
          return;
        }
        // if offline, load from storage
        setIsFetching(true);
        // await test_offlineLoad(expensesCtx, setRefreshing, setIsFetching);
        await expensesCtx.loadExpensesFromStorage();
        setIsFetching(false);
        return;
      }
      // checking isTouched or firstLoad
      const isTouched =
        ignoreTouched || (await fetchTravelerIsTouched(tripid, uid));
      if (!isTouched) {
        setRefreshing(false);
        setIsFetching(false);
        return;
      }
      console.log("we are touched and fetching expenses", tripid);
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
    },
    [
      expensesCtx,
      netCtx.isConnected,
      netCtx.strongConnection,
      tripCtx,
      tripid,
      uid,
      userCtx.freshlyCreated,
    ]
  );
  useEffect(() => {
    LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);
  }, []);

  useInterval(
    () => {
      if (userCtx.freshlyCreated) return;
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

  function errorHandler() {
    setError(null);
  }

  const getRecentExpenses = useCallback(
    () => expensesCtx.getRecentExpenses(PeriodValue),
    [expensesCtx, PeriodValue]
  );
  const recentExpenses = useMemo(getRecentExpenses, [getRecentExpenses]);

  const getExpensesSum = useCallback(
    () =>
      recentExpenses.reduce((sum, expense) => {
        if (isNaN(Number(expense.calcAmount))) return sum;
        return sum + Number(expense.calcAmount);
      }, 0),
    [recentExpenses]
  );
  const expensesSum = useMemo(getExpensesSum, [getExpensesSum]);
  const expensesSumString = formatExpenseWithCurrency(
    expensesSum,
    tripCtx.tripCurrency
  );
  const isLongNumber = expensesSumString.length > 10;
  const { fontScale } = useWindowDimensions();
  const isScaledUp = fontScale > 1;
  const useMoreSpace = isScaledUp || isLongNumber;

  // console.log("RecentExpenses ~ apikey:", apikey);

  const ExpensesOutputJSX = useCallback(
    () => (
      <ExpensesOutput
        expenses={recentExpenses}
        periodValue={PeriodValue}
        fallbackText={i18n.t("fallbackTextExpenses")}
        listRef={listRef}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isFetching}
            tintColor="transparent"
            colors={["transparent"]}
            style={{ backgroundColor: "transparent" }}
            onRefresh={async () => {
              console.log("onREFRESH");
              await onRefresh();
            }}
          />
        }
      />
    ),
    [PeriodValue, isFetching, onRefresh, recentExpenses, refreshing]
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
          {truncateString(tripCtx.tripName, 23)} - {dateTimeString}
          {offlineString}
        </Text>
      </View>

      <View
        style={[
          styles.header,
          useMoreSpace && {
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
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
          textStyle={[
            styles.dropdownTextStyle,
            isScaledUp && styles.scaledUpTextStyle,
          ]}
        />

        <ExpensesSummary
          useMoreSpace={useMoreSpace}
          expenses={recentExpenses}
          periodName={PeriodValue}
        />
      </View>
      <View style={styles.tempGrayBar1}></View>
      {ExpensesOutputJSX()}

      <AddExpenseButton navigation={navigation} />
    </View>
  );
}

export default RecentExpenses;
export const MemoizedRecentExpenses = memo(RecentExpenses);
RecentExpenses.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    justifyContent: "flex-start",
    ...Platform.select({
      ios: {
        padding: 0,
      },
      android: {
        paddingTop: "3%",
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: GlobalStyles.colors.textColor,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        marginTop: "4%",
        elevation: 8,
        borderRadius: 12,
      },
    }),
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 0,
  },
  dropdownTextStyle: {
    fontSize: i18n.locale == "fr" ? 20 : 34,
    fontWeight: "bold",
  },
  scaledUpTextStyle: {
    fontSize: 24,
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
