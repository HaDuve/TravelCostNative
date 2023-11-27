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
import uniqBy from "lodash.uniqby";
import { getMMKVObject, setMMKVObject } from "./mmkv";
export enum RangeString {
  day = "day",
  week = "week",
  month = "month",
  year = "year",
  total = "total",
}

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
      calcAmount,
      iconName,
    }: ExpenseData
  ) => {},
  getRecentExpenses: (rangestring: RangeString): Array<ExpenseData> => {
    return [];
  },
  getYearlyExpenses: (yearsBack) => {
    // firstDay, lastDay, yearlyExpenses;
    return {
      firstDay: new Date(),
      lastDay: new Date(),
      yearlyExpenses: [],
    };
  },
  getMonthlyExpenses: (monthsBack) => {
    // firstDay, lastDay, monthlyExpenses;
    return {
      firstDay: new Date(),
      lastDay: new Date(),
      monthlyExpenses: [],
    };
  },
  getWeeklyExpenses: (weeksBack) => {
    // firstDay, lastDay, weeklyExpenses;
    return {
      firstDay: new Date(),
      lastDay: new Date(),
      weeklyExpenses: [],
    };
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

      const sorted = uniqBy(getSortedState(action.payload), "id");
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

  useEffect(() => {
    async function asyncLoadExpenses() {
      console.log("-----------------\n first time load");
      await loadExpensesFromStorage(true);
    }
    asyncLoadExpenses();
  }, []);

  useEffect(() => {
    // save expenseState in async
    // console.log("saving expenses");
    async function asyncSaveExpenses() {
      if (expensesState?.length > 0)
        // await asyncStoreSetObject("expenses", expensesState);
        setMMKVObject("expenses", expensesState);
    }
    asyncSaveExpenses();
  }, [expensesState]);

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

  function getRecentExpenses(rangestring: RangeString) {
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
     *  returns {firstDay, lastDay, yearlyExpenses}
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

  async function loadExpensesFromStorage(forceLoad = false) {
    if (!forceLoad && expensesState?.length !== 0) {
      // console.log("expenses not empty, will not load again");
      return false;
    }
    // const loadedExpenses = await asyncStoreGetObject("expenses");
    const loadedExpenses = getMMKVObject("expenses");
    // console.log(
    //   "loadExpensesFromStorage ~ loadedExpenses:",
    //   loadedExpenses?.length
    // );
    const expArray = [];
    if (loadedExpenses) {
      loadedExpenses.forEach((expense) => {
        expense.date = new Date(expense.date);
        expense.startDate = new Date(expense.startDate);
        expense.endDate = new Date(expense.endDate);
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
