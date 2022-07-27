import { useContext } from "react";
import { ExpensesContext } from "../store/expenses-context";
import ExpensesOutput from "./../components/ExpensesOutput/ExpensesOutput";

const AllExpenses = () => {
  const expensesContext = useContext(ExpensesContext);
  return (
    <ExpensesOutput
      expenses={expensesContext.expenses}
      expensesPeriod="Total"
    />
  );
};

export default AllExpenses;
