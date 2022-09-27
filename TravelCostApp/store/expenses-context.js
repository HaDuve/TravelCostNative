import { createContext, useReducer } from "react";
import {
  getDateMinusDays,
  getDatePlusDays,
  getPreviousMondayDate,
  toShortFormat,
} from "../util/date";

export const ExpensesContext = createContext({
  expenses: [],
  addExpense: ({
    uid,
    description,
    amount,
    date,
    category,
    country,
    currency,
    whoPaid,
    owePerc,
    calcAmount,
  }) => {},
  setExpenses: (expenses) => {},
  deleteExpense: (id) => {},
  updateExpense: (
    id,
    {
      uid,
      description,
      amount,
      date,
      category,
      country,
      currency,
      whoPaid,
      owePerc,
      calcAmount,
    }
  ) => {},
  getRecentExpenses: (rangestring) => {},
  getMonthlyExpenses: (month) => {
    firstDay, lastDay, monthlyExpenses;
  },
  getWeeklyExpenses: (weeksBack) => {
    firstDay, lastDay, weeklyExpenses;
  },
  getDailyExpenses: (day) => {},
});

function expensesReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET":
      const inverted = action.payload.reverse();
      return inverted;
    case "UPDATE":
      const updatableExpenseIndex = state.findIndex(
        (expense) => expense.id === action.payload.id
      );
      const updatableExpense = state[updatableExpenseIndex];
      const updatedItem = { ...updatableExpense, ...action.payload.data };
      const updatedExpenses = [...state];
      updatedExpenses[updatableExpenseIndex] = updatedItem;
      return updatedExpenses;
    case "DELETE":
      return state.filter((expense) => expense.id !== action.payload);
    default:
      return state;
  }
}

function ExpensesContextProvider({ children }) {
  const [expensesState, dispatch] = useReducer(expensesReducer, []);

  function addExpense(expenseData) {
    dispatch({ type: "ADD", payload: expenseData });
  }

  function setExpenses(expenses) {
    dispatch({ type: "SET", payload: expenses });
  }

  function deleteExpense(id) {
    dispatch({ type: "DELETE", payload: id });
  }

  function updateExpense(id, expenseData) {
    dispatch({ type: "UPDATE", payload: { id: id, data: expenseData } });
  }
  function getRecentExpenses(rangestring) {
    switch (rangestring) {
      case "day":
        return expensesState.filter((expense) => {
          const today = new Date();
          const date7DaysAgo = getDateMinusDays(today, 1);

          return expense.date >= date7DaysAgo && expense.date <= today;
        });
        break;
      case "week":
        return expensesState.filter((expense) => {
          const today = new Date();
          const date7DaysAgo = getDateMinusDays(today, 7);

          return expense.date >= date7DaysAgo && expense.date <= today;
        });
        break;
      case "month":
        return expensesState.filter((expense) => {
          const today = new Date();
          const date7DaysAgo = getDateMinusDays(today, 30);

          return expense.date >= date7DaysAgo && expense.date <= today;
        });
        break;
      case "year":
        return expensesState.filter((expense) => {
          const today = new Date();
          const date7DaysAgo = getDateMinusDays(today, 365);

          return expense.date >= date7DaysAgo && expense.date <= today;
        });
        break;
      case "total":
        return expensesState;
        break;

      default:
        return expensesState;
        break;
    }
  }

  function getMonthlyExpenses(monthsBack) {
    /*
     *  Returns an object containing the first date, last date of a month and
     *  the expenses in that range.
     *  returns {firstDay, lastDay, monthlyExpenses}
     */
    const daysBefore = monthsBack * 30;
    const today = new Date();

    const dayBack = getDateMinusDays(today, daysBefore);

    const firstDay = new Date(dayBack.getFullYear(), dayBack.getMonth(), 1);

    const lastDay = new Date(dayBack.getFullYear(), dayBack.getMonth() + 1, 0);

    const monthlyExpenses = expensesState.filter((expense) => {
      return expense.date >= firstDay && expense.date <= lastDay;
    });
    return { firstDay, lastDay, monthlyExpenses };
  }
  function getWeeklyExpenses(weeksBack) {
    /*
     *  Returns an object containing the first date, last date of a month and
     *  the expenses in that range.
     *  returns {firstDay, lastDay, weeklyExpenses}
     */
    const daysBefore = weeksBack * 7;
    const today = new Date();

    const dayBack = getDateMinusDays(today, daysBefore);
    const prevMonday = getPreviousMondayDate(dayBack);
    const firstDay = prevMonday;
    const lastDay = getDatePlusDays(prevMonday, 6);
    const weeklyExpenses = expensesState.filter((expense) => {
      return expense.date >= firstDay && expense.date <= lastDay;
    });
    return { firstDay, lastDay, weeklyExpenses };
  }
  function getDailyExpenses(daysBack) {
    const today = new Date();
    const dayBack = getDateMinusDays(today, daysBack);
    const dayExpenses = expensesState.filter((expense) => {
      return expense.date.toDateString() === dayBack.toDateString();
    });
    return dayExpenses;
  }

  const value = {
    expenses: expensesState,
    addExpense: addExpense,
    setExpenses: setExpenses,
    deleteExpense: deleteExpense,
    updateExpense: updateExpense,
    getRecentExpenses: getRecentExpenses,
    getMonthlyExpenses: getMonthlyExpenses,
    getWeeklyExpenses: getWeeklyExpenses,
    getDailyExpenses: getDailyExpenses,
  };

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export default ExpensesContextProvider;
