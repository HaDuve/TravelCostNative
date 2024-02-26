import { DateOrDateTime } from "./date";
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

export function getTravellerSum(expenses: ExpenseData[], traveller: string) {
  // return the sum of expenses for a given traveller
  const expensesSum = expenses.reduce((sum: number, expense: ExpenseData) => {
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
 * Find the top 3 most duplicated objects in an array.
 * @param {Array<ExpenseData>} objectsArray - The array of objects to search.
 * @returns {Array<ExpenseData>} - An array containing the top 3 most duplicated objects.
 */
export function findMostDuplicatedDescriptionExpenses(objectsArray) {
  const duplicatesMap = {};

  // Step 1: Create a map with count as value to track duplicates
  for (const obj of objectsArray) {
    if (Object.prototype.hasOwnProperty.call(duplicatesMap, obj.description)) {
      duplicatesMap[obj.description]++;
    } else {
      duplicatesMap[obj.description] = 1;
    }
  }

  // Step 2: Sort the map by count
  const sortedDuplicates = Object.entries(duplicatesMap).sort(
    (a, b) => Number(b[1]) - Number(a[1])
  );

  // Step 3: Get the top 3 duplicates as ExpenseData objects
  const top3Duplicates = sortedDuplicates.slice(0, 3).map(([description]) => {
    // Find the original ExpenseData object with this description
    const originalObject = objectsArray.find(
      (obj) => obj.description === description
    );
    return originalObject;
  });

  return top3Duplicates;
}
