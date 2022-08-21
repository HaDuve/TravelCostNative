import { useContext, useEffect, useState } from "react";
import { Button } from "react-native-web";
import DropDownPicker from "react-native-dropdown-picker";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { getDateMinusDays } from "../util/date";
import { fetchExpenses, fetchUser } from "../util/http";

function RecentExpenses() {
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();
  const [range, setRange] = useState("day");

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("day");
  const [items, setItems] = useState([
    { label: "Day", value: "day" },
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
  switch (value) {
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

  return (
    <>
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
      />
      <ExpensesOutput
        expenses={recentExpenses}
        expensesPeriod={"Expenses this " + range}
        fallbackText={"No expenses in " + range}
      />
    </>
  );
}

export default RecentExpenses;
