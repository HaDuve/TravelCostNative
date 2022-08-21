import { useContext, useEffect } from "react";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { fetchExpenses } from "../util/http";

function AllExpenses() {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;

  useEffect(() => {
    async function getExpenses() {
      try {
        const expenses = await fetchExpenses(tripid, uid);
        expensesCtx.setExpenses(expenses);
      } catch (error) {
        setError("Could not fetch data from the web database!" + error);
      }
    }

    getExpenses();
  }, []);

  return (
    <>
      <ExpensesOutput expenses={expensesCtx.expenses} expensesPeriod="Total" />
    </>
  );
}

export default AllExpenses;
