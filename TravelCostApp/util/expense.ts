import {
  getMMKVObject,
  getMMKVString,
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";

import { DateOrDateTime, isToday } from "./date";
import { getAllExpenses } from "./http";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
} from "./offline-queue";
import { splitType } from "./split";

// expense interface
export interface Expense {
  tripid: string;
  uid: string;
  id?: string;
  expenseData?: ExpenseData;
}

export interface ExpenseData {
  id?: string;
  uid?: string;
  splitType: splitType;
  startDate: DateOrDateTime;
  endDate: DateOrDateTime;
  categoryString: string;
  description: string;
  amount: number;
  date: DateOrDateTime;
  category: string;
  country?: string;
  currency: string;
  whoPaid: string;
  calcAmount: number;
  duplOrSplit?: number;
  splitList?: Split[];
  listEQUAL?: string[];
  iconName?: string;
  rangeId?: string;
  isPaid?: string;
  isSpecialExpense?: boolean;
  editedTimestamp?: number;
  isDeleted?: boolean;
  serverTimestamp?: number;
}

export enum DuplicateOption {
  null = 0,
  duplicate = 1,
  split = 2,
}

export enum isPaidString {
  paid = "paid",
  notPaid = "not paid",
}

export interface ExpenseDataOnline {
  isPaid: string;
  id?: string;
  uid?: string;
  splitType: splitType;
  startDate: string;
  endDate: string;
  categoryString: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  country?: string;
  currency: string;
  whoPaid: string;
  calcAmount: number;
  duplOrSplit?: number;
  splitList?: Split[];
  iconName?: string;
  rangeId?: string;
  isSpecialExpense?: boolean;
  editedTimestamp?: string;
  isDeleted?: boolean;
  serverTimestamp?: number;
}

export interface Split {
  userName: string;
  amount: number;
  whoPaid?: string;
  rate?: number;
}

export async function deleteAllExpensesByRangedId(
  tripid: string,
  selectedExpense: ExpenseData,
  isOnline: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenseCtx: any
) {
  const allExpenses = await getAllExpenses(tripid);

  // const rangedExpenses = allExpenses.filter(
  //   (expense) => expense?.rangeId == selectedExpense?.rangeId
  // );
  // const countRangedExpensesMax = rangedExpenses?.length;
  // console.log(
  //   "deleteAllExpenses ~ countRangedExpensesMax:",
  //   countRangedExpensesMax
  // );
  // let expCounter = 0;
  for (let i = 0; i < allExpenses?.length; i++) {
    const expense: ExpenseData = allExpenses[i];
    if (expense?.rangeId == selectedExpense?.rangeId) {
      // expCounter++;
      const queueItem: OfflineQueueManageExpenseItem = {
        type: "delete",
        expense: {
          tripid,
          uid: expense.uid,
          id: expense.id,
        },
      };
      expenseCtx?.deleteExpense(expense.id);
      await deleteExpenseOnlineOffline(queueItem, isOnline);
      // console.log("deleted expense nr: " + expCounter, expense.id);
    }
  }
}

/**
 * Deduplicates range expenses to avoid double-counting.
 * For range expenses, we only want to count each range once, not once per day.
 * @param expenses Array of expenses to deduplicate
 * @returns Array of expenses with range expenses deduplicated
 */
export function deduplicateRangeExpenses(
  expenses: ExpenseData[]
): ExpenseData[] {
  const processedRangeIds = new Set<string>();
  return expenses.filter((expense: ExpenseData) => {
    if (expense.rangeId) {
      if (processedRangeIds.has(expense.rangeId)) {
        return false; // Skip this expense as we've already processed this range
      }
      processedRangeIds.add(expense.rangeId);
    }
    return true;
  });
}

/**
 * Calculate total expenses sum with deduplication for range expenses.
 * Use this for total/overall calculations where each range should be counted once.
 */
export function getExpensesSumTotal(
  expenses: ExpenseData[],
  hideSpecial = false
) {
  const deduplicatedExpenses = deduplicateRangeExpenses(expenses);
  return calculateExpensesSum(deduplicatedExpenses, hideSpecial);
}

/**
 * Calculate expenses sum for a specific time period, counting all days of range expenses.
 * Use this for daily/weekly/monthly/yearly calculations where each day should be counted.
 */
export function getExpensesSumPeriod(
  expenses: ExpenseData[],
  hideSpecial = false
) {
  return calculateExpensesSum(expenses, hideSpecial);
}

/**
 * Internal helper to calculate expenses sum
 */
function calculateExpensesSum(expenses: ExpenseData[], hideSpecial = false) {
  const sum = expenses.reduce((sum: number, expense: ExpenseData) => {
    if (
      isNaN(Number(expense.calcAmount)) ||
      (hideSpecial && expense.isSpecialExpense)
    )
      return sum;
    return sum + Number(expense.calcAmount);
  }, 0);
  return sum;
}

// Deprecated: Use getExpensesSumTotal or getExpensesSumPeriod instead
export function getExpensesSum(expenses: ExpenseData[], hideSpecial = false) {
  return getExpensesSumPeriod(expenses, hideSpecial);
}

export function getTravellerSum(
  expenses: ExpenseData[],
  traveller: string,
  isTotal = false
) {
  // Only deduplicate range expenses for total view
  const deduplicatedExpenses = isTotal
    ? deduplicateRangeExpenses(expenses)
    : expenses;

  // return the sum of expenses for a given traveller
  const expensesSum = deduplicatedExpenses.reduce(
    (sum: number, expense: ExpenseData) => {
      const hasSplits = expense.splitList && expense.splitList?.length > 0;
      if (!hasSplits) {
        const correct = traveller == expense.whoPaid;
        if (!correct) return sum;
        if (!expense.calcAmount) return sum + Number(expense.amount);
        return sum + Number(expense.calcAmount);
      } else {
        const split = expense.splitList.find(
          split => split.userName === traveller
        );
        const correct = split;
        if (!correct || !split) return sum;

        // Safely parse the split amount, handling both string and number types
        const splitAmount =
          typeof split.amount === "string"
            ? Number(String(split.amount).replace(/^0+/, "")) // Remove leading zeros
            : Number(split.amount);

        if (isNaN(splitAmount) || !isFinite(splitAmount)) {
          return sum; // Skip invalid split amounts
        }

        // check if the expense has a calcAmount by comparing it to the amount
        if (!expense.calcAmount || !expense.amount) {
          return sum + splitAmount;
        }

        const hasConversionRate = expense.calcAmount !== expense.amount;
        if (!hasConversionRate) {
          return sum + splitAmount;
        }

        // Check if we need to convert the split amount
        if (expense.calcAmount === expense.amount) {
          // No conversion needed - amounts are in the same currency
          return sum + splitAmount;
        }

        // Calculate the split's portion of the total expense
        const splitRatio = splitAmount / expense.amount;
        const convertedAmount = expense.calcAmount * splitRatio;

        // Validate the result
        if (isNaN(convertedAmount) || !isFinite(convertedAmount)) {
          return sum + splitAmount; // Fallback to original amount
        }

        return sum + convertedAmount;
      }
    },
    0
  );
  return expensesSum;
}

/**
 * Find the top N most duplicated objects in an array.
 * @param {Array<ExpenseData>} expenseArray - The array of objects to search.
 * @returns {Array<ExpenseData>} - An array containing the top 3 most duplicated objects.
 */
export function findMostDuplicatedDescriptionExpenses(
  expenseArray: ExpenseData[],
  numberOfTop = 3
) {
  try {
    const duplicatesMap = {};

    // Step 1: Create a map with count as value to track duplicates
    expenseArray.forEach(exp => {
      const description = exp.description;
      if (duplicatesMap[description]) {
        duplicatesMap[description]++;
      } else {
        if (!exp.rangeId || exp.rangeId.length == 0) {
          duplicatesMap[description] = 1;
        }
      }
    });
    const topExpenses: ExpenseData[] = [];
    // Step 2: Find the top 3 most duplicated objects
    for (let index = 0; index < numberOfTop; index++) {
      const topExpenseInMap = Object.keys(duplicatesMap).reduce(
        (a, b) => (duplicatesMap[a] > duplicatesMap[b] ? a : b),
        0
      );
      const topExpense = expenseArray.find(
        exp => exp.description === topExpenseInMap
      );
      if (topExpense) {
        topExpenses.push(topExpense);
        // remove from map
        delete duplicatesMap[topExpenseInMap];
      }
    }
    return topExpenses;
  } catch (error) {
    return [];
  }
}

export async function getAllExpensesData(tripid: string) {
  const lastCacheUpdateExpenses = getMMKVString(
    `lastUpdateISO_allExpenses_tripid${tripid}`
  );
  const cachedExpenses = getMMKVObject(
    `lastUpdate_allExpenses_tripid_${tripid}`
  );
  const lastUpdateWasToday =
    lastCacheUpdateExpenses &&
    cachedExpenses &&
    isToday(new Date(lastCacheUpdateExpenses));

  const _expenses: ExpenseData[] = lastUpdateWasToday
    ? cachedExpenses
    : await getAllExpenses(tripid);
  if (!lastUpdateWasToday) {
    // update cache
    setMMKVString(
      `lastUpdateISO_allExpenses_tripid${tripid}`,
      new Date().toISOString()
    );
    setMMKVObject(`lastUpdate_allExpenses_tripid_${tripid}`, _expenses);
  }
  return _expenses;
}
