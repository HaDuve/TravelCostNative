import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MemoizedExpensesOutput } from "../components/ExpensesOutput/ExpensesOutput";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import MiniSyncIndicator from "../components/UI/MiniSyncIndicator";
import TripPeriodChrome from "../components/layout/TripPeriodChrome";
import ContentFrame from "../components/layout/ContentFrame";
import { AuthContext } from "../store/auth-context";
import {
  ExpenseContextType,
  ExpensesContext,
  RangeString,
} from "../store/expenses-context";
import { TripContext, TripContextType } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { getOfflineQueue } from "../util/offline-queue";
import { fetchTravelerIsTouched } from "../util/http";

import { StyleSheet, View, RefreshControl } from "react-native";
import { GlobalStyles } from "../constants/styles";
import AddExpenseButton from "../components/ManageExpense/AddExpenseButton";
import NamingBanner from "../components/UI/NamingBanner";
import { DateTime } from "luxon";

import { i18n } from "../i18n/i18n";

import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
import { fetchAndSetExpenses } from "../components/ExpensesOutput/RecentExpensesUtil";
import { _toShortFormat } from "../util/dateTime";
import { useScrollToTop } from "@react-navigation/native";
import { isForeground } from "../util/appState";
import PropTypes from "prop-types";
import Toast from "react-native-toast-message";
import { NetworkContext } from "../store/network-context";
import { sendOfflineQueue } from "../util/offline-queue";
import * as Haptics from "expo-haptics";
import { SettingsContext } from "../store/settings-context";
import { truncateString } from "../util/string";
import { Platform } from "react-native";
import { memo } from "react";
import { getMMKVObject, MMKV_KEYS } from "../store/mmkv";
import { constantScale, dynamicScale } from "../util/scalingUtil";
import { OrientationContext } from "../store/orientation-context";
import { useLayoutProfile } from "../store/layout-context";
import { refreshWithToast } from "../util/refreshWithToast";
import {
  dismissNamingBanner,
  dismissNamingBannerAfterFirstExpense,
  isNamingBannerDismissed,
  shouldShowNamingBanner,
} from "../util/naming-banner";

function RecentExpenses({ navigation }) {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const uid = authCtx.uid;
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;
  const { isTablet } = useContext(OrientationContext);
  const layout = useLayoutProfile();
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
    ) => {
      await fetchAndSetExpenses(
        showRefIndicator,
        showAnyIndicator,
        setIsFetching,
        setRefreshing,
        expensesCtx,
        tripid,
        uid,
      );
    },
    [],
  );
  const getExpenses = useCallback(
    async (
      showRefIndicator = false,
      showAnyIndicator = false,
      ignoreTouched = false,
    ) => {
      // if (ignoreTouched)
      // check offlinemode
      const online = netCtx.isConnected && netCtx.strongConnection;
      const offlineQueue = getMMKVObject(MMKV_KEYS.OFFLINE_QUEUE);
      const queueBlocked = offlineQueue && offlineQueue?.length > 0;

      if (userCtx.isSendingOfflineQueueMutex) {
        return;
      }

      if (!online) {
        await expensesCtx.loadExpensesFromStorage();
        return;
      }

      if (queueBlocked) {
        await sendOfflineQueue(
          userCtx.isSendingOfflineQueueMutex,
          userCtx.setIsSendingOfflineQueueMutex,
          { updateExpenseId: expensesCtx.updateExpenseId },
        );
        const queueAfterSync = getMMKVObject(MMKV_KEYS.OFFLINE_QUEUE) || [];
        if (queueAfterSync.length > 0) {
          return;
        }
      }
      // checking isTouched or firstLoad
      const isTouched =
        ignoreTouched || (await fetchTravelerIsTouched(tripid, uid));
      if (!isTouched) {
        setRefreshing(false);
        setIsFetching(false);
        return;
      }
      // fetch and set expenses

      await fetchExpenses(
        showRefIndicator,
        showAnyIndicator,
        setIsFetching,
        setRefreshing,
        expensesCtx,
        tripid,
        uid,
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
      userCtx.isSendingOfflineQueueMutex,
    ],
  );

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState();

  const [open, setOpen] = useState(false);

  const PeriodValue = userCtx.periodName;

  const [dateTimeString, setDateTimeString] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    // check if we have a offline queue
    const offlineQueue = await getOfflineQueue();
    // if we have a offline queue return
    if (offlineQueue && offlineQueue?.length > 0) {
      return;
    }

    try {
      await refreshWithToast({
        showRefIndicator: true,
        showAnyIndicator: true,
        setIsFetching,
        setRefreshing,
        expensesCtx,
        tripid,
        uid,
      });
    } catch (error) {
      // Error handling is done in refreshWithToast
    }
  }, [expensesCtx, tripid, uid, setIsFetching, setRefreshing]);

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
  const tripExpenseCount = expensesCtx.expenses?.length ?? 0;
  const [namingBannerDismissed, setNamingBannerDismissed] = useState(() =>
    isNamingBannerDismissed(tripid),
  );

  useEffect(() => {
    setNamingBannerDismissed(isNamingBannerDismissed(tripid));
  }, [tripid]);

  useEffect(() => {
    if (!tripCtx.isImplicitDefault) return;
    if (tripExpenseCount < 1) return;
    dismissNamingBannerAfterFirstExpense(
      tripid,
      tripExpenseCount,
      tripCtx.isImplicitDefault,
    );
    setNamingBannerDismissed(true);
  }, [tripExpenseCount, tripCtx.isImplicitDefault, tripid]);

  const showNamingBanner = shouldShowNamingBanner({
    isImplicitDefault: tripCtx.isImplicitDefault === true,
    isDismissed: namingBannerDismissed,
    expenseCount: tripExpenseCount,
  });

  const handleNameIt = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ManageTrip", {
      tripId: tripid,
      mode: "promote",
    });
  }, [navigation, tripid]);

  const handleNamingLater = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismissNamingBanner(tripid);
    setNamingBannerDismissed(true);
  }, [tripid]);

  const handleEmptyCtaPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (settings.skipCategoryScreen) {
      navigation.navigate("ManageExpense", { pickedCat: "undefined" });
    } else {
      navigation.navigate("CategoryPick");
    }
  }, [navigation, settings.skipCategoryScreen]);

  const tripLedgerEmpty = tripExpenseCount === 0;
  // Only gate on the first session fetch; later isFetching (pull-to-refresh) must keep empty visible.
  const awaitingTripFetch = tripLedgerEmpty && !loadedOnce;

  useEffect(() => {
    const asyncLoading = async () => {
      // if expenses not empty, return
      if (!loadedOnce && !expensesCtx.expenses?.length) {
        await getExpenses(true, true, true);
        setLoadedOnce(true);
      }
    };
    asyncLoading();
  }, [
    expensesCtx.expenses?.length,
    getExpenses,
    loadedOnce,
    netCtx.isConnected,
    netCtx.strongConnection,
  ]);

  useEffect(() => {
    async function setTravellers() {
      if (netCtx.isConnected && netCtx.strongConnection) {
        if (tripCtx.travellers && tripCtx.travellers?.length > 1) return;
        try {
          await tripCtx.fetchAndSetTravellers(tripCtx.tripid);
        } catch (error) {}
      } else {
        await tripCtx.loadTravellersFromStorage();
      }
    }
    setTravellers();
  }, [tripCtx.tripid, netCtx.isConnected, netCtx.strongConnection]);

  useInterval(
    () => {
      setDateTimeString(_toShortFormat(DateTime.now()));
      if (isForeground()) {
        const asyncPolling = async () => {
          await getExpenses(false, true);
        };
        asyncPolling();
      }
    },
    DEBUG_POLLING_INTERVAL,
    true,
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
    [expensesCtx.expenses?.length, PeriodValue, today],
  );
  const recentExpenses = getRecentExpenses;

  const getExpensesSum = useCallback(
    () =>
      recentExpenses.reduce((sum, expense) => {
        if (isNaN(Number(expense.calcAmount))) return sum;
        return sum + Number(expense.calcAmount);
      }, 0),
    [recentExpenses?.length],
  );
  // const expensesSum = useMemo(getExpensesSum, [getExpensesSum]);
  // const expensesSumString = formatExpenseWithCurrency(
  //   expensesSum,
  //   tripCtx.tripCurrency
  // );

  const ExpensesOutputJSX = (
    <MemoizedExpensesOutput
      expenses={recentExpenses}
      fallbackText={i18n.t("fallbackTextExpenses")}
      emptyCtaLabel={tripLedgerEmpty ? i18n.t("addExp") : undefined}
      onEmptyCtaPress={tripLedgerEmpty ? handleEmptyCtaPress : undefined}
      awaitingTripFetch={awaitingTripFetch}
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
    />
  );
  if (error && !isFetching) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }
  // if (isFetching) {
  //   return <LoadingOverlay />;
  // }
  return (
    <View
      testID="recent-expenses-screen"
      style={[styles.container, isTablet && styles.tabletPaddingTop]}
    >
      <ContentFrame
        layout={layout}
        style={styles.contentFrame}
        testID="recent-expenses-content-frame"
      >
        <TripPeriodChrome
          tripLabel={`${truncateString(tripCtx.tripName, 23)} - ${dateTimeString}${offlineString}`}
          syncSlot={
            <MiniSyncIndicator
              isVisible={expensesCtx.isSyncing}
              size={dynamicScale(16, false, 0.5)}
            />
          }
          periodValue={PeriodValue}
          periodItems={items}
          periodOpen={open}
          onPeriodOpenChange={(nextOpen) => {
            requestAnimationFrame(() => {
              setOpen(nextOpen);
              Toast.hide();
            });
          }}
          onPeriodValueChange={userCtx.setPeriodString}
          onPeriodItemsChange={setItems}
          onPeriodOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPeriodClose={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPeriodSelectItem={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          expenses={recentExpenses}
        />
        {showNamingBanner && (
          <NamingBanner onNameIt={handleNameIt} onLater={handleNamingLater} />
        )}
        {ExpensesOutputJSX}
      </ContentFrame>

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
        // paddingTop: "3%",
      },
    }),
  },
  tabletPaddingTop: {
    paddingTop: constantScale(16, 0.5),
  },
  contentFrame: {
    flex: 1,
    paddingHorizontal: 0,
  },
});
