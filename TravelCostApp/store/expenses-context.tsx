/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  trackAsyncFunction,
  logFunctionTime,
  logRender,
} from "../util/performance";
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
  ) => void;
  setExpenses: (expenses: Array<ExpenseData>) => void;
  mergeExpenses: (newExpenses: Array<ExpenseData>) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (
    id: string,
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
  ) => void;
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

export const ExpensesContext = createContext<ExpenseContextType>({
  expenses: [],
  // Sync loading state defaults
  isSyncing: false,
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
  mergeExpenses: (newExpenses) => {},
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
  updateExpenseId: (oldId: string, newId: string) => {},
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

  loadExpensesFromStorage: async () => false,
  // Sync state management defaults
  setIsSyncing: (syncing: boolean) => {},
});

function expensesReducer(state: ExpenseData[], action) {
  const toTime = (value: any): number => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value?.toMillis === "function") return value.toMillis();
    return new Date(value).getTime();
  };

  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET": {
      const getSortedState = (data: ExpenseData[]) =>
        data.sort((a: ExpenseData, b: ExpenseData) => {
          return toTime(b.date) - toTime(a.date);
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
          // New expense, add it
          mergedExpenses.push(newExpense);
        }
      });

      // Filter out deleted expenses from the final set
      const filteredExpenses = mergedExpenses.filter(
        (expense) => !deletedIds.includes(expense.id)
      );

      // Sort by date (newest first) and remove duplicates
      const getSortedState = (data: ExpenseData[]) =>
        data.sort((a: ExpenseData, b: ExpenseData) => {
          return toTime(b.date) - toTime(a.date);
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

// Deduplicate storage reads across concurrent callers / remounts.
// IMPORTANT: only dedupe the *MMKV read + parsing*, not React state setters.
let loadExpensesArrayFromStorageInFlight: Promise<ExpenseData[]> | null = null;
let cachedExpensesArrayFromStorage: ExpenseData[] | null = null;

function readExpensesArrayFromMMKV(): ExpenseData[] {
  const loadedExpenses = getMMKVObject(MMKV_KEYS.EXPENSES);
  const expArray: ExpenseData[] = [];

  if (loadedExpenses && Array.isArray(loadedExpenses)) {
    loadedExpenses.forEach((expense) => {
      expense.date = new Date(expense.date);
      expense.startDate = new Date(expense.startDate);
      expense.endDate = new Date(expense.endDate);
      expArray.push(expense);
    });
  }

  return expArray;
}

function ExpensesContextProvider({ children }) {
  const [expensesState, dispatch] = useReducer(expensesReducer, []);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const toJSDate = useCallback((value: any): Date => {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (typeof value?.toJSDate === "function") return value.toJSDate();
    return new Date(value);
  }, []);

  const toTime = useCallback(
    (value: any): number => {
      const d = toJSDate(value);
      return d.getTime();
    },
    [toJSDate]
  );

  // Track renders
  React.useEffect(() => {
    logRender("ExpensesContextProvider", "state changed", [
      "expensesState",
    ]);
  });

  const hasLoadedFromStorageRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (!expensesState?.length) {
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      const startTime = Date.now();
      setMMKVObject(MMKV_KEYS.EXPENSES, expensesState);
      logFunctionTime(
        "asyncSaveExpenses",
        startTime,
        Date.now(),
        "context-update",
        { expenseCount: expensesState.length }
      );
    }, 400);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
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

  const getYearlyExpenses = useCallback(
    (yearsBack: number) => {
      /*
       *  Returns an object containing the first date, last date of a month and
       *  the expenses in that range.
       *  returns {firstDay, lastDay, yearlyExpenses}
       */
      const daysBefore = yearsBack * 365;
      const today = new Date();

      const dayBack = toJSDate(getDateMinusDays(today, daysBefore));

      const firstDay = new Date(
        dayBack.getFullYear(),
        dayBack.getMonth() - 1,
        1
      );

      const lastDay = new Date(
        dayBack.getFullYear() + 1,
        dayBack.getMonth() - 1,
        0
      );
      const firstMs = firstDay.getTime();
      const lastMs = lastDay.getTime();
      const yearlyExpenses = expensesState.filter((expense) => {
        const ms = toTime(expense.date);
        return !expense.isDeleted && ms >= firstMs && ms <= lastMs;
      });
      return { firstDay, lastDay, yearlyExpenses };
    },
    [expensesState, toJSDate, toTime]
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

      const dayBack = toJSDate(getDateMinusDays(today, daysBefore));

      const firstDay = new Date(dayBack.getFullYear(), dayBack.getMonth(), 1);

      const lastDay = new Date(dayBack.getFullYear(), dayBack.getMonth() + 1, 0);

      const firstMs = firstDay.getTime();
      const lastMs = lastDay.getTime();
      const monthlyExpenses = expensesState.filter((expense) => {
        const ms = toTime(expense.date);
        return !expense.isDeleted && ms >= firstMs && ms <= lastMs;
      });
      return { firstDay, lastDay, monthlyExpenses };
    },
    [expensesState, toJSDate, toTime]
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

      const dayBack = toJSDate(getDateMinusDays(today, daysBefore));
      const prevMonday = toJSDate(getPreviousMondayDate(dayBack));
      const firstDay = prevMonday;
      const lastDay = toJSDate(getDatePlusDays(prevMonday, 6));
      const firstMs = firstDay.getTime();
      const lastMs = lastDay.getTime();
      const weeklyExpenses = expensesState.filter((expense) => {
        const ms = toTime(expense.date);
        return !expense.isDeleted && ms >= firstMs && ms <= lastMs;
      });
      return { firstDay, lastDay, weeklyExpenses };
    },
    [expensesState, toJSDate, toTime]
  );

  const getDailyExpenses = useCallback(
    (daysBack: number) => {
      const today = new Date();
      const dayBack = toJSDate(getDateMinusDays(today, daysBack));
      const dayBackStr = dayBack.toDateString();
      const dayExpenses = expensesState.filter((expense) => {
        const d = toJSDate(expense.date);
        return (
          !expense.isDeleted &&
          d.toDateString() === dayBackStr
        );
      });

      return dayExpenses;
    },
    [expensesState, toJSDate]
  );

  const getSpecificDayExpenses = useCallback(
    (date) => {
      const day = toJSDate(date);
      const dayStr = day.toDateString();
      const dayExpenses = expensesState.filter((expense) => {
        const d = toJSDate(expense.date);
        return (
          !expense.isDeleted &&
          d.toDateString() === dayStr
        );
      });
      return dayExpenses;
    },
    [expensesState, toJSDate]
  );

  const getSpecificWeekExpenses = useCallback(
    (date) => {
      const base = toJSDate(date);
      const prevMonday = toJSDate(getPreviousMondayDate(base));
      const firstDay = prevMonday;
      const lastDay = toJSDate(getDatePlusDays(prevMonday, 6));
      const firstMs = firstDay.getTime();
      const lastMs = lastDay.getTime();
      const weeklyExpenses = expensesState.filter((expense) => {
        const ms = toTime(expense.date);
        return (
          !expense.isDeleted && ms >= firstMs && ms <= lastMs
        );
      });
      return weeklyExpenses;
    },
    [expensesState, toJSDate, toTime]
  );

  const getSpecificMonthExpenses = useCallback(
    (date) => {
      const d = toJSDate(date);
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const firstMs = firstDay.getTime();
      const lastMs = lastDay.getTime();

      const monthlyExpenses = expensesState.filter((expense) => {
        const ms = toTime(expense.date);
        return (
          !expense.isDeleted && ms >= firstMs && ms <= lastMs
        );
      });
      return monthlyExpenses;
    },
    [expensesState, toJSDate, toTime]
  );

  const getSpecificYearExpenses = useCallback(
    (date) => {
      const d = toJSDate(date);
      const firstDay = new Date(d.getFullYear(), 0, 1);
      const lastDay = new Date(d.getFullYear(), 11, 31);
      const firstMs = firstDay.getTime();
      const lastMs = lastDay.getTime();

      const yearlyExpenses = expensesState.filter((expense) => {
        const ms = toTime(expense.date);
        return (
          !expense.isDeleted && ms >= firstMs && ms <= lastMs
        );
      });
      return yearlyExpenses;
    },
    [expensesState, toJSDate, toTime]
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
      if (!forceLoad && expensesState?.length !== 0) {
        return false;
      }

      // If we've already read a large list once, reuse it to avoid repeated parsing.
      if (!forceLoad && cachedExpensesArrayFromStorage) {
        setExpenses(cachedExpensesArrayFromStorage);
        return true;
      }

      if (!loadExpensesArrayFromStorageInFlight) {
        loadExpensesArrayFromStorageInFlight = (async () => {
          try {
            const expArray = readExpensesArrayFromMMKV();
            cachedExpensesArrayFromStorage = expArray.length ? expArray : null;
            return expArray;
          } finally {
            loadExpensesArrayFromStorageInFlight = null;
          }
        })();
      }

      const expArray = await loadExpensesArrayFromStorageInFlight;
      if (expArray?.length) {
        setExpenses(expArray);
      }
      return true;
    },
    [expensesState?.length, setExpenses]
  );

  useEffect(() => {
    async function asyncLoadExpenses() {
      if (hasLoadedFromStorageRef.current) return;
      hasLoadedFromStorageRef.current = true;

      await trackAsyncFunction(
        loadExpensesFromStorage,
        "loadExpensesFromStorage",
        "context-init"
      )(true);
    }
    asyncLoadExpenses();
  }, [loadExpensesFromStorage]);

  // Filter out soft-deleted expenses for display
  const filteredExpenses = useMemo(
    () => expensesState.filter((expense) => !expense.isDeleted),
    [expensesState]
  );

  // (debug logs removed - kept behavior identical)

  // Log filtering results for debugging
  if (expensesState.length !== filteredExpenses.length) {
    const deletedCount = expensesState.length - filteredExpenses.length;

    // Log details of deleted expenses
    const deletedExpenses = expensesState.filter(
      (expense) => expense.isDeleted
    );
  }

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
      filteredExpenses,
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
      setIsSyncing,
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
