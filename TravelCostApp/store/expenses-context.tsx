import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  getDateMinusDays,
  getDatePlusDays,
  getPreviousMondayDate,
} from "../util/date";
import PropTypes from "prop-types";
import { ExpenseData } from "../util/expense";
import uniqBy from "lodash.uniqby";
import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "./mmkv";
export enum RangeString {
  day = "day",
  week = "week",
  month = "month",
  year = "year",
  total = "total",
}

export type ExpenseContextType = {
  expenses: Array<ExpenseData>;
  // Sync loading state
  isSyncing: boolean;
  addExpense: (expense: ExpenseData, id?: string) => void;
  setExpenses: (expenses: Array<ExpenseData>) => void;
  mergeExpenses: (newExpenses: Array<ExpenseData>) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (id: string, expense: ExpenseData) => void;
  updateExpenseId: (oldId: string, newId: string) => void;
  getRecentExpenses: (rangestring: RangeString) => Array<ExpenseData>;
  getYearlyExpenses: (yearsBack: number) => {
    firstDay: Date;
    lastDay: Date;
    yearlyExpenses: Array<ExpenseData>;
  };
  getMonthlyExpenses: (monthsBack: number) => {
    firstDay: Date;
    lastDay: Date;
    monthlyExpenses: Array<ExpenseData>;
  };
  getWeeklyExpenses: (weeksBack: number) => {
    firstDay: Date;
    lastDay: Date;
    weeklyExpenses: Array<ExpenseData>;
  };
  getDailyExpenses: (daysBack: number) => Array<ExpenseData>;
  getSpecificDayExpenses: (date: Date) => Array<ExpenseData>;
  getSpecificWeekExpenses: (date: Date) => Array<ExpenseData>;
  getSpecificMonthExpenses: (date: Date) => Array<ExpenseData>;
  getSpecificYearExpenses: (date: Date) => Array<ExpenseData>;
  loadExpensesFromStorage: (forceLoad?: boolean) => Promise<boolean>;
  // Sync state management
  setIsSyncing: (syncing: boolean) => void;
};

const noop = () => undefined;
const noopAsyncBool = async () => false;

export const ExpensesContext = createContext<ExpenseContextType>({
  expenses: [],
  // Sync loading state defaults
  isSyncing: false,
  addExpense: noop,
  setExpenses: noop,
  mergeExpenses: noop,
  deleteExpense: noop,
  updateExpense: noop,
  updateExpenseId: noop,
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

  loadExpensesFromStorage: noopAsyncBool,
  // Sync state management defaults
  setIsSyncing: noop,
});

// Fingerprint for offline-created rows vs server rows with different ids.
// Keep uid, editedTimestamp, amount, description, and date in sync when changing matching.
function findOfflineCreatedDuplicateIndex(
  expenses: ExpenseData[],
  incoming: ExpenseData
): number {
  if (!incoming.editedTimestamp) {
    return -1;
  }
  const incomingDate = Number(new Date(incoming.date));
  return expenses.findIndex(
    (exp) =>
      !exp.isDeleted &&
      exp.id !== incoming.id &&
      exp.uid === incoming.uid &&
      exp.editedTimestamp === incoming.editedTimestamp &&
      exp.amount === incoming.amount &&
      exp.description === incoming.description &&
      Number(new Date(exp.date)) === incomingDate
  );
}

export function mergeExpenseLists(
  state: ExpenseData[],
  newExpenses: ExpenseData[]
): ExpenseData[] {
  return expensesReducer(state, { type: "MERGE", payload: newExpenses });
}

export function expensesReducer(state: ExpenseData[], action) {
  switch (action.type) {
    case "ADD": {
      const id = action.payload?.id;
      if (id && state.some((expense) => expense.id === id)) {
        return state;
      }
      return [action.payload, ...state];
    }
    case "SET": {
      const getSortedState = (data: ExpenseData[]) =>
        data.sort((a: ExpenseData, b: ExpenseData) => {
          return Number(new Date(b.date)) - Number(new Date(a.date));
        });

      const sorted = uniqBy(getSortedState(action.payload), "id");
      return sorted;
    }
    case "MERGE": {
      const newExpenses = action.payload;
      if (!newExpenses || newExpenses.length === 0) {
        return state;
      }

      // Create array of deleted expense IDs from sync results
      const deletedIds = newExpenses
        .filter((expense) => expense.isDeleted === true)
        .map((expense) => expense.id);

      // Create a map of existing expenses by ID for quick lookup
      const existingExpensesMap = new Map();
      state.forEach((expense) => {
        existingExpensesMap.set(expense.id, expense);
      });

      // Merge new expenses with existing ones
      const mergedExpenses = [...state];

      newExpenses.forEach((newExpense) => {
        const existingExpense = existingExpensesMap.get(newExpense.id);

        if (existingExpense) {
          // If expense exists, check if new one is more recent based on serverTimestamp
          const existingTimestamp =
            existingExpense.serverTimestamp ||
            existingExpense.editedTimestamp ||
            0;
          const newTimestamp =
            newExpense.serverTimestamp || newExpense.editedTimestamp || 0;

          if (newTimestamp > existingTimestamp) {
            // Update existing expense with newer data
            const index = mergedExpenses.findIndex(
              (exp) => exp.id === newExpense.id
            );
            if (index !== -1) {
              mergedExpenses[index] = newExpense;
            }
          }
          // If existing is newer or equal, keep existing (do nothing)
        } else {
          const offlineDuplicateIndex = findOfflineCreatedDuplicateIndex(
            mergedExpenses,
            newExpense
          );
          if (offlineDuplicateIndex !== -1) {
            mergedExpenses[offlineDuplicateIndex] = newExpense;
          } else {
            mergedExpenses.push(newExpense);
          }
        }
      });

      // Filter out deleted expenses from the final set
      const filteredExpenses = mergedExpenses.filter(
        (expense) => !deletedIds.includes(expense.id)
      );

      // Sort by date (newest first) and remove duplicates
      const getSortedState = (data: ExpenseData[]) =>
        data.sort((a: ExpenseData, b: ExpenseData) => {
          return Number(new Date(b.date)) - Number(new Date(a.date));
        });

      const sorted = uniqBy(getSortedState(filteredExpenses), "id");
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
    case "UPDATE_ID": {
      const { oldId, newId } = action.payload;
      const expenseIndex = state.findIndex((expense) => expense.id === oldId);
      if (expenseIndex === -1) {
        return state;
      }
      const updatedExpenses = [...state];
      updatedExpenses[expenseIndex] = {
        ...updatedExpenses[expenseIndex],
        id: newId,
      };
      return updatedExpenses;
    }
    default:
      return state;
  }
}

function ExpensesContextProvider({ children }) {
  const [expensesState, dispatch] = useReducer(expensesReducer, []);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const expensesCount = expensesState.length;

  useEffect(() => {
    async function asyncLoadExpenses() {
      await loadExpensesFromStorage(true);
    }
    asyncLoadExpenses();
  }, []);

  useEffect(() => {
    // save expenseState in async
    async function asyncSaveExpenses() {
      if (expensesState?.length > 0)
        // await asyncStoreSetObject("expenses", expensesState);
        setMMKVObject(MMKV_KEYS.EXPENSES, expensesState);
    }
    asyncSaveExpenses();
  }, [expensesState]);

  const addExpense = useCallback((expenseData: ExpenseData, id?: string) => {
    if (!id) id = new Date().getTime().toString();
    if (!expenseData.id) expenseData.id = id;
    dispatch({ type: "ADD", payload: expenseData });
  }, []);

  const setExpenses = useCallback((expenses: ExpenseData[]) => {
    dispatch({ type: "SET", payload: expenses });
  }, []);

  const mergeExpenses = useCallback((newExpenses: ExpenseData[]) => {
    dispatch({ type: "MERGE", payload: newExpenses });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: "DELETE", payload: id });
  }, []);

  const updateExpense = useCallback((id: string, expenseData: ExpenseData) => {
    dispatch({ type: "UPDATE", payload: { id: id, data: expenseData } });
  }, []);

  const updateExpenseId = useCallback((oldId: string, newId: string) => {
    dispatch({ type: "UPDATE_ID", payload: { oldId, newId } });
  }, []);

  const getDailyExpenses = useCallback(
    (daysBack: number) => {
      const today = new Date();
      const dayBack = getDateMinusDays(today, daysBack);
      const dayExpenses = expensesState.filter((expense) => {
        return (
          !expense.isDeleted &&
          expense.date.toDateString() === dayBack.toDateString()
        );
      });

      return dayExpenses;
    },
    [expensesState]
  );

  const getYearlyExpenses = useCallback(
    (yearsBack: number) => {
      /*
       *  Returns an object containing the first date, last date of a year and
       *  the expenses in that range.
       *  returns {firstDay, lastDay, yearlyExpenses}
       */
      const today = new Date();
      const year = today.getFullYear() - yearsBack;

      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);
      const yearlyExpenses = expensesState.filter((expense) => {
        return (
          !expense.isDeleted &&
          expense.date >= firstDay &&
          expense.date <= lastDay
        );
      });
      return { firstDay, lastDay, yearlyExpenses };
    },
    [expensesState]
  );

  const getMonthlyExpenses = useCallback(
    (monthsBack: number) => {
      /*
       *  Returns an object containing the first date, last date of a month and
       *  the expenses in that range.
       *  returns {firstDay, lastDay, monthlyExpenses}
       */
      const daysBefore = monthsBack * 30;
      const today = new Date();

      const dayBack = getDateMinusDays(today, daysBefore);

      const firstDay = new Date(dayBack.getFullYear(), dayBack.getMonth(), 1);

      const lastDay = new Date(
        dayBack.getFullYear(),
        dayBack.getMonth() + 1,
        0
      );

      const monthlyExpenses = expensesState.filter((expense) => {
        return (
          !expense.isDeleted &&
          expense.date >= firstDay &&
          expense.date <= lastDay
        );
      });
      return { firstDay, lastDay, monthlyExpenses };
    },
    [expensesState]
  );

  const getWeeklyExpenses = useCallback(
    (weeksBack: number) => {
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
        return (
          !expense.isDeleted &&
          expense.date >= firstDay &&
          expense.date <= lastDay
        );
      });
      return { firstDay, lastDay, weeklyExpenses };
    },
    [expensesState]
  );

  const getSpecificDayExpenses = useCallback(
    (date) => {
      const dayExpenses = expensesState.filter((expense) => {
        return (
          !expense.isDeleted &&
          expense.date.toDateString() === date.toDateString()
        );
      });
      return dayExpenses;
    },
    [expensesState]
  );

  const getSpecificWeekExpenses = useCallback(
    (date) => {
      const prevMonday = getPreviousMondayDate(date);
      const firstDay = prevMonday;
      const lastDay = getDatePlusDays(prevMonday, 6);
      const weeklyExpenses = expensesState.filter((expense) => {
        return (
          !expense.isDeleted &&
          expense.date >= firstDay &&
          expense.date <= lastDay
        );
      });
      return weeklyExpenses;
    },
    [expensesState]
  );

  const getSpecificMonthExpenses = useCallback(
    (date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyExpenses = expensesState.filter((expense) => {
        return (
          !expense.isDeleted &&
          expense.date >= firstDay &&
          expense.date <= lastDay
        );
      });
      return monthlyExpenses;
    },
    [expensesState]
  );

  const getSpecificYearExpenses = useCallback(
    (date) => {
      const firstDay = new Date(date.getFullYear(), 0, 1);

      const lastDay = new Date(date.getFullYear(), 11, 31);

      const yearlyExpenses = expensesState.filter((expense) => {
        return (
          !expense.isDeleted &&
          expense.date >= firstDay &&
          expense.date <= lastDay
        );
      });
      return yearlyExpenses;
    },
    [expensesState]
  );

  const getRecentExpenses = useCallback(
    (rangestring: RangeString) => {
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
    },
    [
      expensesState,
      getDailyExpenses,
      getMonthlyExpenses,
      getWeeklyExpenses,
      getYearlyExpenses,
    ]
  );

  const loadExpensesFromStorage = useCallback(
    async (forceLoad = false) => {
      if (!forceLoad && expensesCount !== 0) {
        return false;
      }
      // const loadedExpenses = await asyncStoreGetObject("expenses");
      const loadedExpenses = getMMKVObject(MMKV_KEYS.EXPENSES);
      const expArray = [];
      if (loadedExpenses) {
        loadedExpenses.forEach((expense) => {
          expense.date = new Date(expense.date);
          expense.startDate = new Date(expense.startDate);
          expense.endDate = new Date(expense.endDate);
          expArray.push(expense);
        });
        setExpenses(expArray);
      }
      return true;
    },
    [expensesCount, setExpenses]
  );

  const filteredExpenses = useMemo(
    () => expensesState.filter((expense) => !expense.isDeleted),
    [expensesState]
  );

  const value = useMemo(
    () => ({
      expenses: filteredExpenses,
      // Sync loading state
      isSyncing,
      addExpense,
      setExpenses,
      mergeExpenses,
      deleteExpense,
      updateExpense,
      updateExpenseId,
      getRecentExpenses,
      getYearlyExpenses,
      getMonthlyExpenses,
      getWeeklyExpenses,
      getDailyExpenses,
      getSpecificDayExpenses,
      getSpecificWeekExpenses,
      getSpecificMonthExpenses,
      getSpecificYearExpenses,
      loadExpensesFromStorage,
      // Sync state management
      setIsSyncing,
    }),
    [
      addExpense,
      deleteExpense,
      filteredExpenses,
      getDailyExpenses,
      getMonthlyExpenses,
      getRecentExpenses,
      getSpecificDayExpenses,
      getSpecificMonthExpenses,
      getSpecificWeekExpenses,
      getSpecificYearExpenses,
      getWeeklyExpenses,
      getYearlyExpenses,
      isSyncing,
      loadExpensesFromStorage,
      mergeExpenses,
      setExpenses,
      setIsSyncing,
      updateExpense,
      updateExpenseId,
    ]
  );

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
