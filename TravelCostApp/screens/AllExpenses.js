import { useContext } from "react";
import { Button } from "react-native";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";

function AllExpenses() {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);

  return (
    <>
      <ExpensesOutput expenses={expensesCtx.expenses} expensesPeriod="Total" />
      <Button title="LOGOUT" onPress={authCtx.logout}>
        LOGOUT
      </Button>
    </>
  );
}

export default AllExpenses;
