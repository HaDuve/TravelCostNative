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
import uniqBy from "lodash.uniqby";
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
          tripid: tripid,
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

export function getExpensesSum(expenses: ExpenseData[], hideSpecial = false) {
  // Deduplicate range expenses to avoid double-counting
  // For range expenses, we only want to count each range once, not once per day
  const processedRangeIds = new Set<string>();
  const deduplicatedExpenses = expenses.filter((expense: ExpenseData) => {
    if (expense.rangeId) {
      if (processedRangeIds.has(expense.rangeId)) {
        return false; // Skip this expense as we've already processed this range
      }
      processedRangeIds.add(expense.rangeId);
    }
    return true;
  });

  const sum = deduplicatedExpenses.reduce((sum: number, expense: ExpenseData) => {
    if (
      isNaN(Number(expense.calcAmount)) ||
      (hideSpecial && expense.isSpecialExpense)
    )
      return sum;
    return sum + Number(expense.calcAmount);
  }, 0);
  return sum;
}

export function getTravellerSum(expenses: ExpenseData[], traveller: string) {
  // Deduplicate range expenses to avoid double-counting
  // For range expenses, we only want to count each range once, not once per day
  const processedRangeIds = new Set<string>();
  const deduplicatedExpenses = expenses.filter((expense: ExpenseData) => {
    if (expense.rangeId) {
      if (processedRangeIds.has(expense.rangeId)) {
        return false; // Skip this expense as we've already processed this range
      }
      processedRangeIds.add(expense.rangeId);
    }
    return true;
  });

  // return the sum of expenses for a given traveller
  const expensesSum = deduplicatedExpenses.reduce((sum: number, expense: ExpenseData) => {
    const hasSplits = expense.splitList && expense.splitList?.length > 0;
    if (!hasSplits) {
      const correct = traveller == expense.whoPaid;
      if (!correct) return sum;
      if (!expense.calcAmount) return sum + Number(expense.amount);
      return sum + Number(expense.calcAmount);
    } else {
      const split = expense.splitList.find(
        (split) => split.userName === traveller
      );
      const correct = split;
      if (!correct || !split) return sum;

      // check if the expense has a calcAmount by comparing it to the amount
      // if it is the same, the expense has no calcAmount
      if (!expense.calcAmount || !expense.amount)
        return sum + Number(split.amount);
      const hasConversionRate = expense.calcAmount !== expense.amount;
      if (!hasConversionRate) {
        return sum + Number(split.amount);
      } else {
        // calculate the rate of the split
        const rate = expense.calcAmount / expense.amount;
        // calculate the amount of the split
        const splitAmount = split.amount * rate;
        return sum + Number(splitAmount);
      }
    }
  }, 0);
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
    expenseArray.forEach((exp) => {
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
        (exp) => exp.description === topExpenseInMap
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
    "lastUpdateISO_allExpenses_tripid" + tripid
  );
  const cachedExpenses = getMMKVObject(
    "lastUpdate_allExpenses_tripid_" + tripid
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
      "lastUpdateISO_allExpenses_tripid" + tripid,
      new Date().toISOString()
    );
    setMMKVObject("lastUpdate_allExpenses_tripid_" + tripid, _expenses);
  }
  return _expenses;
}
