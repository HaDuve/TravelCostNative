/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useReducer } from "react";
import {
  getDateMinusDays,
  getDatePlusDays,
  getFormattedDate,
  getPreviousMondayDate,
  toShortFormat,
} from "../util/date";
import { truncateString } from "../util/string";
import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";

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
  getYearlyExpenses: (yearsBack) => {
    // firstDay, lastDay, yearlyExpenses;
  },
  getMonthlyExpenses: (monthsBack) => {
    // firstDay, lastDay, monthlyExpenses;
  },
  getWeeklyExpenses: (weeksBack) => {
    // firstDay, lastDay, weeklyExpenses;
  },
  getDailyExpenses: (daysBack) => {},
  getSpecificDayExpenses: (date) => {},
  getSpecificWeekExpenses: (date) => {},
  getSpecificMonthExpenses: (date) => {},
  getSpecificYearExpenses: (date) => {},

  saveExpensesInStorage: async (expenses) => {},
  loadExpensesFromStorage: async () => {},
});

function expensesReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET": {
      const getSortedState = (data) =>
        data.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
      const sorted = getSortedState(action.payload);
      return sorted;
    }
    case "UPDATE": {
      const updatableExpenseIndex = state.findIndex(
        (expense) => expense.id === action.payload.id
      );
      const updatableExpense = state[updatableExpenseIndex];
      const updatedItem = { ...updatableExpense, ...action.payload.data };
      const updatedExpenses = [...state];
      updatedExpenses[updatableExpenseIndex] = updatedItem;
      return updatedExpenses;
    }
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
    let expenses = [];
    switch (rangestring) {
      case "day":
        return getDailyExpenses(0);
      case "week":
        expenses = getWeeklyExpenses(0).weeklyExpenses;
        return expenses;
      case "month":
        expenses = getMonthlyExpenses(0).monthlyExpenses;
        return expenses;
      case "year":
        expenses = getYearlyExpenses(0).yearlyExpenses;
        return expenses;
      case "total":
        return expensesState;

      default:
        return expensesState;
    }
  }
  function getYearlyExpenses(yearsBack) {
    /*
     *  Returns an object containing the first date, last date of a month and
     *  the expenses in that range.
     *  returns {firstDay, lastDay, monthlyExpenses}
     */
    const daysBefore = yearsBack * 365;
    const today = new Date();

    const dayBack = getDateMinusDays(today, daysBefore);

    const firstDay = new Date(dayBack.getFullYear(), dayBack.getMonth() - 1, 1);

    const lastDay = new Date(
      dayBack.getFullYear() + 1,
      dayBack.getMonth() - 1,
      0
    );
    const yearlyExpenses = expensesState.filter((expense) => {
      return expense.date >= firstDay && expense.date <= lastDay;
    });
    return { firstDay, lastDay, yearlyExpenses };
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

  function getSpecificDayExpenses(date) {
    const dayExpenses = expensesState.filter((expense) => {
      return expense.date.toDateString() === date.toDateString();
    });
    return dayExpenses;
  }

  function getSpecificWeekExpenses(date) {
    const prevMonday = getPreviousMondayDate(date);
    const firstDay = prevMonday;
    const lastDay = getDatePlusDays(prevMonday, 6);
    const weeklyExpenses = expensesState.filter((expense) => {
      return expense.date >= firstDay && expense.date <= lastDay;
    });
    return weeklyExpenses;
  }

  function getSpecificMonthExpenses(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthlyExpenses = expensesState.filter((expense) => {
      return expense.date >= firstDay && expense.date <= lastDay;
    });
    return monthlyExpenses;
  }

  function getSpecificYearExpenses(date) {
    const firstDay = new Date(date.getFullYear(), 0, 1);

    const lastDay = new Date(date.getFullYear(), 11, 31);

    const yearlyExpenses = expensesState.filter((expense) => {
      return expense.date >= firstDay && expense.date <= lastDay;
    });
    return yearlyExpenses;
  }

  async function saveExpensesInStorage(expenses) {
    await asyncStoreSetObject("expenses", expenses);
  }

  async function loadExpensesFromStorage() {
    console.log(
      "loadExpensesFromStorage ~ loadExpensesFromStorage:",
      loadExpensesFromStorage
    );
    if (expensesState.length !== 0) {
      console.log("expenses not empty, will not load again");
      return false;
    }
    const expenses = await asyncStoreGetObject("expenses");
    const expArray = [];
    if (expenses) {
      expenses.forEach((expense) => {
        expense.date = new Date(expense.date);
        expArray.push(expense);
      });
      setExpenses(expArray);
    } else {
      console.warn("no Expenses loaded from Storage!");
    }
    return true;
  }

  const value = {
    expenses: expensesState,
    addExpense: addExpense,
    setExpenses: setExpenses,
    deleteExpense: deleteExpense,
    updateExpense: updateExpense,
    getRecentExpenses: getRecentExpenses,
    getYearlyExpenses: getYearlyExpenses,
    getMonthlyExpenses: getMonthlyExpenses,
    getWeeklyExpenses: getWeeklyExpenses,
    getDailyExpenses: getDailyExpenses,
    getSpecificDayExpenses: getSpecificDayExpenses,
    getSpecificWeekExpenses: getSpecificWeekExpenses,
    getSpecificMonthExpenses: getSpecificMonthExpenses,
    getSpecificYearExpenses: getSpecificYearExpenses,
    saveExpensesInStorage: saveExpensesInStorage,
    loadExpensesFromStorage: loadExpensesFromStorage,
  };

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export default ExpensesContextProvider;
