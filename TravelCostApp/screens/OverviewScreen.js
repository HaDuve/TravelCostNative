import { useContext, useEffect, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { getDateMinusDays, toShortFormat } from "../util/date";
import { fetchExpenses, fetchUser, getAllExpenses } from "../util/http";

import { StyleSheet, Text, View } from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import IconButton from "../components/UI/IconButton";
import ExpensesOverview from "../components/ExpensesOutput/ExpensesOverview";
import AddExpenseButton from "../components/ManageExpense/AddExpenseButton";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const OverviewScreen = ({ navigation }) => {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;
  const token = authCtx.token;

  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();

  const [open, setOpen] = useState(false);
  const [PeriodValue, setPeriodValue] = useState(userCtx.periodName);

  useEffect(() => {
    if (PeriodValue !== userCtx.periodName)
      userCtx.setPeriodString(PeriodValue);
  }, [PeriodValue]);

  useEffect(() => {
    if (PeriodValue !== userCtx.periodName) setPeriodValue(userCtx.periodName);
  }, [userCtx.periodName]);

  const [items, setItems] = useState([
    { label: i18n.t("todayLabel"), value: "day" },
    { label: i18n.t("weekLabel"), value: "week" },
    { label: i18n.t("monthLabel"), value: "month" },
    { label: i18n.t("yearLabel"), value: "year" },
    { label: i18n.t("totalLabel"), value: "total" },
  ]);

  useEffect(() => {
    async function getExpenses() {
      setIsFetching(true);
      try {
        const expenses = await getAllExpenses(tripid);
        expensesCtx.setExpenses(expenses);
      } catch (error) {
        setError(i18n.t("fetchError") + error);
      }
      setIsFetching(false);
    }

    getExpenses();
  }, []);

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

  const valid = recentExpenses.length > 0;

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
      <ExpensesOverview expenses={recentExpenses} periodName={PeriodValue} />
      <AddExpenseButton navigation={navigation}></AddExpenseButton>
    </View>
  );
};

export default OverviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    justifyContent: "flex-start",
  },
  dateHeader: {
    marginTop: 48,
    marginLeft: 36,
    marginBottom: -48,
  },
  dateString: {
    fontSize: 12,
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 1,
    marginTop: 48,
    marginHorizontal: 24,
  },
  dropdownContainer: {
    maxWidth: 160,
  },
  dropdown: {
    borderRadius: 0,
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
    borderBottomWidth: 1,
    borderTopColor: GlobalStyles.colors.gray600,
    borderBottomColor: GlobalStyles.colors.gray600,
    maxHeight: 16,
    minHeight: 4,
    backgroundColor: GlobalStyles.colors.gray500,
    marginBottom: -36,
  },
  tempGrayBar2: {
    borderTopWidth: 1,
    borderTopColor: GlobalStyles.colors.gray600,
    minHeight: 16,
    backgroundColor: GlobalStyles.colors.gray500,
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    flex: 0,
    borderRadius: 100,
    minHeight: 55,
    minWidth: 30,
    marginHorizontal: 160,
    marginTop: -40,
    marginBottom: -15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
