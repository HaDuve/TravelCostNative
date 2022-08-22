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
import { fetchExpenses, fetchUser } from "../util/http";

import { StyleSheet, Text, View } from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import IconButton from "../components/UI/IconButton";

function RecentExpenses({ navigation }) {
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();
  const [range, setRange] = useState("day");

  const [open, setOpen] = useState(false);
  const [PeriodValue, setPeriodValue] = useState("day");
  const [items, setItems] = useState([
    { label: "Today", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
    { label: "Total", value: "total" },
  ]);

  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;
  const token = authCtx.token;

  useEffect(() => {
    async function getExpenses() {
      setIsFetching(true);
      try {
        const expenses = await fetchExpenses(tripid, uid);
        expensesCtx.setExpenses(expenses);
      } catch (error) {
        setError("Could not fetch data from the web database!" + error);
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
  switch (PeriodValue) {
    case "day":
      recentExpenses = expensesCtx.expenses.filter((expense) => {
        const today = new Date();
        const date7DaysAgo = getDateMinusDays(today, 1);

        return expense.date >= date7DaysAgo && expense.date <= today;
      });
      break;
    case "week":
      recentExpenses = expensesCtx.expenses.filter((expense) => {
        const today = new Date();
        const date7DaysAgo = getDateMinusDays(today, 7);

        return expense.date >= date7DaysAgo && expense.date <= today;
      });
      break;
    case "month":
      recentExpenses = expensesCtx.expenses.filter((expense) => {
        const today = new Date();
        const date7DaysAgo = getDateMinusDays(today, 30);

        return expense.date >= date7DaysAgo && expense.date <= today;
      });
      break;
    case "year":
      recentExpenses = expensesCtx.expenses.filter((expense) => {
        const today = new Date();
        const date7DaysAgo = getDateMinusDays(today, 365);

        return expense.date >= date7DaysAgo && expense.date <= today;
      });
      break;
    case "total":
      recentExpenses = expensesCtx.expenses;
      break;

    default:
      recentExpenses = expensesCtx.expenses;
      break;
  }

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
        <ExpensesSummary
          expenses={recentExpenses}
          periodName={PeriodValue}
        ></ExpensesSummary>
      </View>
      <View style={styles.tempGrayBar1}></View>
      <ExpensesOutput
        expenses={recentExpenses}
        expensesPeriod={"Expenses this " + range}
        fallbackText={"No expenses in " + range}
      />
      <View style={styles.addButton}>
        <IconButton
          icon="add"
          size={30}
          color={"white"}
          onPress={() => {
            navigation.navigate("ManageExpense");
          }}
        />
      </View>
      <View style={styles.tempGrayBar2}></View>
    </View>
  );
}

export default RecentExpenses;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: "white",
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
    marginBottom: 12,
  },
  dropdownContainer: {
    maxWidth: 160,
  },
  dropdown: {
    borderRadius: 0,
    borderWidth: 0,
  },
  dropdownTextStyle: {
    fontSize: 25,
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
    minHeight: 24,
    backgroundColor: GlobalStyles.colors.gray500,
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
    marginBottom: -15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
