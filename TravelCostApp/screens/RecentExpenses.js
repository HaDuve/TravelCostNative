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
  fetchTravelerIsTouched,
  getAllExpenses,
  unTouchTraveler,
} from "../util/http";

import { StyleSheet, Text, View, RefreshControl, LogBox } from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import AddExpenseButton from "../components/ManageExpense/AddExpenseButton";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
import { useInterval } from "../components/Hooks/useInterval";
import Toast from "react-native-toast-message";
import { DEBUG_POLLING_INTERVAL } from "../appConfig";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

function RecentExpenses({ navigation }) {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();

  const [open, setOpen] = useState(false);
  const [PeriodValue, setPeriodValue] = useState("day");

  useEffect(() => {
    LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);
  }, []);

  useEffect(() => {
    if (!userCtx.isOnline) return;
    getExpenses(true, true);
  }, []);

  useInterval(
    () => {
      const asyncPolling = async () => {
        await getExpenses(true, true);
      };
      asyncPolling();
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
    await userCtx.checkConnectionUpdateUser();
    if (!userCtx.isOnline) {
      await expensesCtx.loadExpensesFromStorage();
      setRefreshing(false);
      setIsFetching(false);
      return;
    }
    // checking isTouched
    const isTouched = await fetchTravelerIsTouched(tripid, uid);
    if (!isTouched) {
      setRefreshing(false);
      setIsFetching(false);
      return;
    }
    console.log("we are touched and fetching expenses");
    if (!showRefIndicator && !showAnyIndicator) setIsFetching(true);
    if (!showAnyIndicator) setRefreshing(true);
    try {
      const expenses = await getAllExpenses(tripid, uid);
      expensesCtx.setExpenses(expenses);
      await expensesCtx.saveExpensesInStorage(expenses);

      const expensesSum = expenses.reduce((sum, expense) => {
        return sum + expense.calcAmount;
      }, 0);
      tripCtx.setTotalSum(expensesSum);
      await unTouchTraveler(tripid, uid);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not fetch trip data",
        visibilityTime: 1000,
      });
      console.error(error);
      // setError(i18n.t("fetchError") + error);
    }
    if (!showRefIndicator && !showAnyIndicator) setIsFetching(false);
    if (!showAnyIndicator) setRefreshing(false);
  }

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = getExpenses.bind(this, true);

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

  let todayDateString = new Date();
  todayDateString = toShortFormat(todayDateString);

  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateString}>{todayDateString}</Text>
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
