import {
  getMMKVObject,
  getMMKVString,
  MMKV_KEY_PATTERNS,
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
  isPaid?: isPaidString;
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

/**
 * Computes the effective isPaid status for an expense based on timestamp override logic.
 * If trip was settled (isPaidTimestamp exists) and expense was created/edited before settlement,
 * then the expense is effectively "paid" regardless of its stored isPaid value.
 *
 * @param expense - The expense data
 * @param tripIsPaidTimestamp - The timestamp when the trip was settled (in milliseconds)
 * @returns The effective isPaid status (paid or not paid)
 */
export function getEffectiveIsPaid(
  expense: ExpenseData,
  tripIsPaidTimestamp?: number
): isPaidString {
  // If no trip settlement timestamp, use expense's stored isPaid value
  if (!tripIsPaidTimestamp || tripIsPaidTimestamp === 0) {
    return expense.isPaid ?? isPaidString.notPaid;
  }

  // Get expense editedTimestamp, default to 0 if missing
  const expenseTimestamp = expense.editedTimestamp || 0;

  // If trip was settled after expense was created/edited, override to "paid"
  if (tripIsPaidTimestamp > expenseTimestamp) {
    return isPaidString.paid;
  }

  // Otherwise, use expense's stored isPaid value
  return expense.isPaid ?? isPaidString.notPaid;
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
  editOrder?: number; // 0 = most recent edit, higher = older edits, undefined = never edited
}

export async function deleteAllExpensesByRangedId(
  tripid: string,
  selectedExpense: ExpenseData,
  isOnline: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenseCtx: any
) {
  // Use local expenses context instead of server data for ranged deletion
  // Server data might be incomplete or not synced yet
  const allExpenses = expenseCtx?.expenses || [];

  // Collect all expenses to delete first
  const expensesToDelete = allExpenses.filter(
    (expense) =>
      expense?.rangeId === selectedExpense?.rangeId && !expense.isDeleted
  );

  // Delete all expenses from server first
  for (let i = 0; i < expensesToDelete.length; i++) {
    const expense: ExpenseData = expensesToDelete[i];

    const queueItem: OfflineQueueManageExpenseItem = {
      type: "delete",
      expense: {
        tripid: tripid,
        uid: expense.uid,
        id: expense.id,
      },
    };
    // Soft delete: call server first
    await deleteExpenseOnlineOffline(queueItem, isOnline);
  }

  // Only remove from local state after all server deletions are complete
  for (let i = 0; i < expensesToDelete.length; i++) {
    const expense: ExpenseData = expensesToDelete[i];
    expenseCtx?.deleteExpense(expense.id);
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
          (split) => split.userName === traveller
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
    MMKV_KEY_PATTERNS.LAST_UPDATE_ISO_ALL_EXPENSES_TRIP(tripid)
  );
  const cachedExpenses = getMMKVObject(
    MMKV_KEY_PATTERNS.LAST_UPDATE_ALL_EXPENSES_TRIP(tripid)
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
      MMKV_KEY_PATTERNS.LAST_UPDATE_ISO_ALL_EXPENSES_TRIP(tripid),
      new Date().toISOString()
    );
    setMMKVObject(
      MMKV_KEY_PATTERNS.LAST_UPDATE_ALL_EXPENSES_TRIP(tripid),
      _expenses
    );
  }
  return _expenses;
}
