import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { DateTime } from "luxon";
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";
import { TourGuideZone } from "rn-tourguide";

import { MemoizedExpensesOutput } from "../components/ExpensesOutput/ExpensesOutput";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import MiniSyncIndicator from "../components/UI/MiniSyncIndicator";
import { AuthContext } from "../store/auth-context";
import {
  ExpenseContextType,
  ExpensesContext,
  RangeString,
} from "../store/expenses-context";
import { TripContext, TripContextType } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { fetchTravelerIsTouched } from "../util/http";
import { getOfflineQueue } from "../util/offline-queue";

import AddExpenseButton from "../components/ManageExpense/AddExpenseButton";
import { GlobalStyles } from "../constants/styles";

//Localization

import { de, en, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { fetchAndSetExpenses } from "../components/ExpensesOutput/RecentExpensesUtil";
import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
import { _toShortFormat } from "../util/dateTime";

import { useFocusEffect, useScrollToTop } from "@react-navigation/native";

import { isForeground } from "../util/appState";

import { NetworkContext } from "../store/network-context";
import { sendOfflineQueue } from "../util/offline-queue";

import * as Haptics from "expo-haptics";

import { getMMKVObject } from "../store/mmkv";
import { OrientationContext } from "../store/orientation-context";
import { SettingsContext } from "../store/settings-context";
import { constantScale, dynamicScale } from "../util/scalingUtil";
import { formatExpenseWithCurrency, truncateString } from "../util/string";
import { normalizeTravellers } from "../util/traveller-utils";

function RecentExpenses({ navigation }) {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const uid = authCtx.uid;
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;
  const { isPortrait, isTablet } = useContext(OrientationContext);
  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected && netCtx.strongConnection;
  const { settings } = useContext(SettingsContext);
  const listRef = React.useRef(null);
  useScrollToTop(listRef);

  //wrap fetchAndSetExpenses in a callback
  const fetchExpenses = useCallback(
    async (
      showRefIndicator: boolean,
      showAnyIndicator: boolean,
      setIsFetching: (isFetching: boolean) => void,
      setRefreshing: (isRefreshing: boolean) => void,
      expensesCtx: ExpenseContextType,
      tripid: string,
      uid: string,
      tripCtx: TripContextType
    ) => {
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
    []
  );
  const getExpenses = useCallback(
    async (
      showRefIndicator = false,
      showAnyIndicator = false,
      ignoreTouched = false
    ) => {
      if (userCtx.freshlyCreated) return;
      // if (ignoreTouched)
      // console.log("getExpenses ~ ignoreTouched:", ignoreTouched);
      // check offlinemode
      const online = netCtx.isConnected && netCtx.strongConnection;
      const offlineQueue = getMMKVObject("offlineQueue");
      const queueBlocked = offlineQueue && offlineQueue?.length > 0;
      if (!online || queueBlocked || userCtx.isSendingOfflineQueueMutex) {
        // if online, send offline queue
        if (online) {
          // console.log("RecentExpenses ~ sending offline queue");
          await sendOfflineQueue(
            userCtx.isSendingOfflineQueueMutex,
            userCtx.setIsSendingOfflineQueueMutex
          );
          return;
        }
        // if offline, load from storage
        // setIsFetching(true);
        // await test_offlineLoad(expensesCtx, setRefreshing, setIsFetching);
        await expensesCtx.loadExpensesFromStorage();
        // setIsFetching(false);
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
      // console.log("we are touched and fetching expenses", tripid);
      // fetch and set expenses

      await fetchExpenses(
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
      // expensesCtx, // commented because react native does weird stuff with objects in dependencies
      fetchExpenses,
      netCtx.isConnected,
      netCtx.strongConnection,
      // tripCtx,
      tripid,
      uid,
      userCtx.freshlyCreated,
      userCtx.isSendingOfflineQueueMutex,
    ]
  );

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

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState();

  const [open, setOpen] = useState(false);

  const PeriodValue = userCtx.periodName;

  const [dateTimeString, setDateTimeString] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    // console.log("refreshing: ", refreshing);
    setRefreshing(true);
    // check if we have a offline queue
    const offlineQueue = await getOfflineQueue();
    // if we have a offline queue return
    if (offlineQueue && offlineQueue?.length > 0) {
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
    ? ` - ${lastConnectionSpeedInMbps?.toFixed(
        2
      )} ${i18n.t("megaBytePerSecond")}`
    : "";
  // set in useEffect
  useEffect(() => {
    if (isOnline) {
      setOfflineString(connectionSpeedString);
    } else {
      if (netCtx.isConnected && !netCtx.strongConnection) {
        setOfflineString(`${connectionSpeedString}`);
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
        expensesCtx.expenses?.length > 0
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
        if (
          tripCtx.travellers &&
          normalizeTravellers(tripCtx.travellers).length > 1
        )
          return;
        try {
          await tripCtx.fetchAndSetTravellers(tripCtx.tripid);
        } catch (error) {
          // console.log("error loading travellers in expenseForm");
        }
      } else {
        await tripCtx.loadTravellersFromStorage();
      }
    }
    setTravellers();
  }, [tripCtx.tripid, netCtx.isConnected, netCtx.strongConnection]);

  useInterval(
    () => {
      if (userCtx.freshlyCreated) return;
      const now = DateTime.now();
      setDateTimeString(_toShortFormat(now));
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
  const today = DateTime.now().get("day");

  const getRecentExpenses = useMemo(
    () => expensesCtx.getRecentExpenses(PeriodValue),
    [expensesCtx.expenses?.length, PeriodValue, today]
  );
  const recentExpenses = getRecentExpenses;

  const getExpensesSum = useCallback(
    () =>
      recentExpenses.reduce((sum, expense) => {
        if (isNaN(Number(expense.calcAmount))) return sum;
        return sum + Number(expense.calcAmount);
      }, 0),
    [recentExpenses?.length]
  );
  const expensesSum = useMemo(getExpensesSum, [getExpensesSum]);
  const expensesSumString = formatExpenseWithCurrency(
    expensesSum,
    tripCtx.tripCurrency
  );
  const isLongNumber = expensesSumString?.length > 10;
  const { fontScale } = useWindowDimensions();
  const isScaledUp = fontScale > 1;
  const useMoreSpace = (isScaledUp || isLongNumber) && !isTablet;

  const ExpensesOutputJSX = (
    <MemoizedExpensesOutput
      expenses={recentExpenses}
      fallbackText={i18n.t("fallbackTextExpenses")}
      refreshing={refreshing}
      refreshControl={
        <RefreshControl
          progressViewOffset={dynamicScale(8, true)}
          refreshing={refreshing || isFetching}
          tintColor={GlobalStyles.colors.textColor}
          colors={[GlobalStyles.colors.textColor]}
          style={{
            backgroundColor: "transparent",
            marginBottom: dynamicScale(-12, true),
          }}
          onRefresh={async () => {
            await onRefresh();
          }}
        />
      }
      showSumForTravellerName={false}
      isFiltered={false}
    />
  );
  if (error && !isFetching) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }
  // if (isFetching) {
  //   return <LoadingOverlay />;
  // }
  return (
    <View style={[styles.container, isTablet && styles.tabletPaddingTop]}>
      <TourGuideZone
        text={i18n.t("walk1")}
        zone={1}
        maskOffset={constantScale(-4, 0.5)}
        tooltipBottomOffset={constantScale(200, 0.5)}
      ></TourGuideZone>
      <TourGuideZone
        text={i18n.t("walk8")}
        zone={8}
        maskOffset={constantScale(-4, 0.5)}
        tooltipBottomOffset={constantScale(-200, 0.5)}
      ></TourGuideZone>
      <TourGuideZone
        text={i18n.t("walk3")}
        maskOffset={constantScale(200, 0.5)}
        tooltipBottomOffset={constantScale(-200, 0.5)}
        zone={3}
      ></TourGuideZone>
      <View
        style={[
          styles.dateHeader,
          !isPortrait && styles.landscapeDateHeader,
          isTablet && styles.landscapeDateHeader,
        ]}
      >
        <View style={styles.dateHeaderContent}>
          <Text style={styles.dateString}>
            {truncateString(tripCtx.tripName, 23)} - {dateTimeString}
            {offlineString}
          </Text>
          <MiniSyncIndicator
            isVisible={expensesCtx.isSyncing}
            size={dynamicScale(16, false, 0.5)}
          />
        </View>
      </View>

      <View
        style={[
          styles.header,
          useMoreSpace && {
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          },
          !isPortrait && styles.landscapeHeader,
        ]}
      >
        <DropDownPicker
          open={open}
          value={PeriodValue}
          items={items}
          showTickIcon={false}
          setOpen={() => {
            requestAnimationFrame(() => {
              setOpen(!open);
              Toast.hide();
            });
          }}
          placeholder={""}
          onOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onClose={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onSelectItem={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          setValue={(value: any) =>
            userCtx.setPeriodString(value as RangeString)
          }
          setItems={setItems}
          containerStyle={styles.dropdownContainer}
          dropDownContainerStyle={styles.dropdownContainerDropdown}
          itemProps={{
            style: {
              height: dynamicScale(50, false, 0.5),
              padding: dynamicScale(4, false, 0.5),
              marginLeft: dynamicScale(4),
            },
          }}
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
      <View
        style={[styles.tempGrayBar1, !isPortrait && styles.landscapeBar]}
      ></View>
      {ExpensesOutputJSX}

      <AddExpenseButton navigation={navigation} />
    </View>
  );
}

export default RecentExpenses;
export const MemoizedRecentExpenses = memo(RecentExpenses);

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flex: 1,
    justifyContent: "flex-start",
    padding: 0,
    ...Platform.select({
      ios: {
        padding: 0,
      },
      android: {
        // paddingTop: "3%",
      },
    }),
  },
  dateHeader: {
    marginBottom: dynamicScale(-20, true),
    marginLeft: dynamicScale(12),
    marginVertical: dynamicScale(16, true),
  },
  dateHeaderContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateString: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(12, false, 0.5),
    fontStyle: "italic",
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 0,
  },
  dropdownContainer: {
    marginTop: dynamicScale(8, true),
    maxWidth: dynamicScale(170, false, 0.5),
    ...Platform.select({
      ios: {
        shadowColor: GlobalStyles.colors.textColor,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        // marginTop: "4%",
        elevation: 8,
        borderRadius: 12,
      },
    }),
  },
  dropdownContainerDropdown: {
    maxHeight: dynamicScale(600, true),
  },
  dropdownTextStyle: {
    fontSize:
      i18n.locale == "fr"
        ? dynamicScale(20, false, 0.5)
        : dynamicScale(34, false, 0.5),
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: dynamicScale(12, true),
    marginHorizontal: dynamicScale(8),
    marginTop: dynamicScale(24, true),
    zIndex: 10,
  },
  landscapeBar: {
    // marginTop: dynamicScale(24, true),
    // marginBottom: dynamicScale(-8, true),
  },
  landscapeDateHeader: {
    alignSelf: "center",
    marginBottom: dynamicScale(-24, true),
    marginTop: dynamicScale(4, true),
  },
  landscapeHeader: {
    marginTop: dynamicScale(4, true),
    // marginBottom: dynamicScale(-12, true),
    zIndex: 10,
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: dynamicScale(12),
  },
  scaledUpTextStyle: {
    fontSize: dynamicScale(24, false, 0.5),
  },
  tabletPaddingTop: {
    paddingTop: constantScale(16, 0.5),
  },
  tempGrayBar1: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderBottomColor: GlobalStyles.colors.gray600,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderTopWidth: 1,
    elevation: 2,
    minHeight: 1,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 2,
  },
  zBehind: {
    zIndex: 10,
  },
});
