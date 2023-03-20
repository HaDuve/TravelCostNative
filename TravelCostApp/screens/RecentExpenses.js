import React, { useContext, useEffect, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
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
import { en, de } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confApp";
import {
  fetchAndSetExpenses,
  offlineLoad,
} from "../components/ExpensesOutput/RecentExpensesUtil";
import { asyncStoreGetItem, asyncStoreSetItem } from "../store/async-storage";
import { _toShortFormat } from "../util/dateTime";
import { useFocusEffect } from "@react-navigation/native";
import { isForeground } from "../util/appState";
import { TourGuideZone } from "rn-tourguide";

function RecentExpenses({ navigation }) {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;
  const [isFocused, setIsFocused] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState();
  const [firstFocus, setFirstFocus] = useState(false);

  const [open, setOpen] = useState(false);
  const [PeriodValue, setPeriodValue] = useState("day");
  userCtx.setPeriodString(PeriodValue);

  const [dateTimeString, setDateTimeString] = useState("");

  const test_getExpenses = dataResponseTime(getExpenses);
  const test_userCtx_checkConnectionUpdateUser = dataResponseTime(
    userCtx.checkConnectionUpdateUser
  );
  const test_offlineLoad = dataResponseTime(offlineLoad);
  const test_fetchTravelerIsTouched = dataResponseTime(fetchTravelerIsTouched);
  const test_fetchAndSetExpenses = dataResponseTime(fetchAndSetExpenses);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = test_getExpenses.bind(this, true);

  useFocusEffect(
    React.useCallback(() => {
      console.log("focused");
      setIsFocused(true);
      setFirstFocus(true);
      async function poll() {
        const online = await test_getExpenses(true, true);
      }
      poll();
      return () => {
        console.log("unfocused");
        setIsFocused(false);
      };
    }, [])
  );

  useEffect(() => {
    LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);
  }, []);

  useInterval(
    () => {
      setDateTimeString(_toShortFormat(DateTime.now()));
      if (isForeground() && isFocused) {
        const asyncPolling = async () => {
          await test_getExpenses(true, true);
          // await getExpenses(true, true);
        };
        asyncPolling();
      }
    },
    DEBUG_POLLING_INTERVAL,
    true
  );

  const [items, setItems] = useState([
    { label: i18n.t("todayLabel"), value: "day" },
    { label: i18n.t("weekLabel"), value: "week" },
    { label: i18n.t("monthLabel"), value: "month" },
    { label: i18n.t("yearLabel"), value: "year" },
    { label: i18n.t("totalLabel"), value: "total" },
  ]);

  async function getExpenses(
    showRefIndicator = false,
    showAnyIndicator = false
  ) {
    // check offlinemode
    const online = await test_userCtx_checkConnectionUpdateUser();
    console.log("RecentExpenses ~ online:", online);
    // await userCtx.checkConnectionUpdateUser();
    // console.log("RecentExpenses ~ userCtx.isOnline:", userCtx.isOnline);
    if (!online) {
      if (!firstFocus) return;
      setIsFetching(true);
      const loaded = await test_offlineLoad(
        expensesCtx,
        setRefreshing,
        setIsFetching
      );
      setIsFetching(false);
      setFirstFocus(false);
      return;
    }
    // checking isTouched or firstLoad
    let isTouched = await test_fetchTravelerIsTouched(tripid, uid);
    console.log("RecentExpenses ~ isTouched:", isTouched);
    if (!isTouched) {
      setRefreshing(false);
      setIsFetching(false);
      return;
    }
    console.log("we are touched and fetching expenses");
    // fetch and set expenses

    await test_fetchAndSetExpenses(
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

  if (error && !isFetching) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }
  if (isFetching) {
    return <LoadingOverlay />;
  }

  let recentExpenses = [];
  recentExpenses = expensesCtx.getRecentExpenses(PeriodValue);

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
        <Text style={styles.dateString}>{dateTimeString}</Text>
      </View>

      <View style={styles.header}>
        <DropDownPicker
          open={open}
          value={PeriodValue}
          items={items}
          setOpen={setOpen}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <AddExpenseButton navigation={navigation} />
    </View>
  );
}

export default RecentExpenses;

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
    fontSize: 34,
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
