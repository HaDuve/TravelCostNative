/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useEffect, useReducer } from "react";
import {
  getDateMinusDays,
  getDatePlusDays,
  getFormattedDate,
  getPreviousMondayDate,
  toShortFormat,
} from "../util/date";
import { truncateString } from "../util/string";
import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";
import PropTypes from "prop-types";
import { Expense, ExpenseData } from "../util/expense";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ExpensesContext = createContext({
  expenses: [],
  addExpense: (
    {
      uid,
      description,
      amount,
      date,
      startDate,
      endDate,
      category,
      country,
      currency,
      whoPaid,
      owePerc,
      calcAmount,
      iconName,
    }: ExpenseData,
    id?: string
  ) => {},
  setExpenses: (expenses) => {},
  deleteExpense: (id) => {},
  updateExpense: (
    id,
    {
      description,
      amount,
      date,
      category,
      country,
      currency,
      whoPaid,
      owePerc,
      calcAmount,
      iconName,
    }: ExpenseData
  ) => {},
  getRecentExpenses: (rangestring): Array<ExpenseData> => {
    return [];
  },
  getYearlyExpenses: (yearsBack) => {
    // firstDay, lastDay, yearlyExpenses;
  },
  getMonthlyExpenses: (monthsBack) => {
    // firstDay, lastDay, monthlyExpenses;
  },
  getWeeklyExpenses: (weeksBack) => {
    // firstDay, lastDay, weeklyExpenses;
  },
  getDailyExpenses: (daysBack): Array<ExpenseData> => {
    return [];
  },
  getSpecificDayExpenses: (date): Array<ExpenseData> => {
    return [];
  },
  getSpecificWeekExpenses: (date): Array<ExpenseData> => {
    return [];
  },
  getSpecificMonthExpenses: (date): Array<ExpenseData> => {
    return [];
  },
  getSpecificYearExpenses: (date): Array<ExpenseData> => {
    return [];
  },

  loadExpensesFromStorage: async () => {},
});

function expensesReducer(state: ExpenseData[], action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET": {
      const getSortedState = (data: ExpenseData[]) =>
        data.sort((a: ExpenseData, b: ExpenseData) => {
          return Number(new Date(b.date)) - Number(new Date(a.date));
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

  function addExpense(expenseData: ExpenseData) {
    dispatch({ type: "ADD", payload: expenseData });
  }

  function setExpenses(expenses: ExpenseData[]) {
    dispatch({ type: "SET", payload: expenses });
  }

  function deleteExpense(id: string) {
    dispatch({ type: "DELETE", payload: id });
  }

  function updateExpense(id: string, expenseData: ExpenseData) {
    dispatch({ type: "UPDATE", payload: { id: id, data: expenseData } });
  }
  function getRecentExpenses(rangestring: string) {
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
  function getYearlyExpenses(yearsBack: number) {
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
  function getMonthlyExpenses(monthsBack: number) {
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
  function getWeeklyExpenses(weeksBack: number) {
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
  function getDailyExpenses(daysBack: number) {
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

  async function loadExpensesFromStorage() {
    if (expensesState.length !== 0) {
      console.log("expenses not empty, will not load again");
      return false;
    }
    const loadedExpenses = await asyncStoreGetObject("expenses");
    const expArray = [];
    if (loadedExpenses) {
      loadedExpenses.forEach((expense) => {
        expense.date = new Date(expense.date);
        expArray.push(expense);
      });
      setExpenses(expArray);
      // console.log("loadExpensesFromStorage ~ expArray:", expArray);
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
    loadExpensesFromStorage: loadExpensesFromStorage,
  };

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export default ExpensesContextProvider;
ExpensesContextProvider.propTypes = {
  children: PropTypes.node,
};
