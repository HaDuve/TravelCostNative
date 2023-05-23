import { ExpenseData } from "./expense";
import {
  OfflineQueueManageExpenseItem,
  updateExpenseOnlineOffline,
} from "./offline-queue";

export async function settleAllSplits(tripid: string, expenseCtx) {
  const expenses: ExpenseData[] = expenseCtx.expenses;
  try {
    for (const expenseData of expenses) {
      if (expenseData.isPaid) continue;
      expenseData.isPaid = "true";
      const item: OfflineQueueManageExpenseItem = {
        type: "update",
        expense: {
          tripid: tripid,
          uid: expenseData.uid,
          expenseData: expenseData,
          id: expenseData.id,
        },
      };
      expenseCtx.updateExpense(expenseData.id, expenseData);
      await updateExpenseOnlineOffline(item);
    }
    console.log("All expenses have been settled successfully.");
  } catch (error) {
    console.warn(error);
    throw new Error("Error while settling expenses.");
  }
}
