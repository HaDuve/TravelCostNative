import { DateOrDateTime } from "./date";
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

  const rangedExpenses = allExpenses.filter(
    (expense) => expense?.rangeId == selectedExpense?.rangeId
  );
  const countRangedExpensesMax = rangedExpenses?.length;
  console.log(
    "deleteAllExpenses ~ countRangedExpensesMax:",
    countRangedExpensesMax
  );
  let expCounter = 0;
  for (let i = 0; i < allExpenses?.length; i++) {
    const expense: ExpenseData = allExpenses[i];
    if (expense?.rangeId == selectedExpense?.rangeId) {
      expCounter++;
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
      console.log("deleted expense nr: " + expCounter, expense.id);
    }
  }
}
