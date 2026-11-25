import type { ExpenseData } from "./expense";
import { isSameDay } from "./dateTime";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
  updateExpenseOnlineOffline,
} from "./offline-queue";
import {
  planNonRangedToRangedInstances,
  planRangedExpenseInPlaceUpdates,
  planRangedExpenseReplacement,
  shouldReplaceRangedExpenseInstances,
} from "./plan-ranged-expense-edit";
import {
  persistRangedExpenseAdd,
  persistRangedExpenseInPlaceEdit,
  persistRangedExpenseReplace,
  type RangedExpensePersistContext,
} from "./ranged-expense-persist";
import { collectUserDeleteTargets } from "./user-delete-expense";

/**
 * Applies the submit-time **Expense currency** rate (Trip currency per
 * Expense currency unit) to a submitted Expense: derives `calcAmount`, stamps the
 * rate on every **Split** row, and clears the Split list for SELF Splits.
 * Mutates and returns `expenseData` (same as the Expense form submit path).
 */
export function applySubmitRate(
  expenseData: ExpenseData,
  rate: number
): ExpenseData {
  expenseData.calcAmount = expenseData.amount / rate;
  expenseData.splitList?.forEach((split) => {
    split.rate = rate;
  });
  if (expenseData.splitType === "SELF") {
    expenseData.splitList = [];
  }
  return expenseData;
}

export interface EditExpenseContext extends RangedExpensePersistContext {
  /** Active (non-deleted) Expenses of the trip. */
  expenses: ExpenseData[];
}

export interface EditExpenseParams {
  tripid: string;
  /** Signed-in User; adds of new ranged instances are authored by them. */
  uid: string;
  isOnline: boolean;
  expenseCtx: EditExpenseContext;
  /** The Expense being edited, as stored before the edit. */
  selectedExpense: ExpenseData;
  /** Author of the stored Expense (may be another Traveller). */
  selectedExpenseAuthorUid: string;
  /** Submitted form payload (rate already applied via {@link applySubmitRate}). */
  expenseData: ExpenseData;
  newRangeId: () => string;
}

function spansMultipleDays(expenseData: ExpenseData): boolean {
  return !isSameDay(expenseData.endDate, expenseData.startDate);
}

/**
 * Saves an edited Expense. Every path leaves the trip equal to deleting the old
 * Expense (whole range) and adding the edited one from scratch.
 * Resolves with the still-pending sync of a **Ranged expense** edit, if any
 * (wrapped so awaiting this call does not wait for the sync).
 */
export async function persistExpenseEdit(
  params: EditExpenseParams
): Promise<{ rangedSyncPromise: Promise<void> | null }> {
  const { expenseData, selectedExpense } = params;
  if (spansMultipleDays(expenseData) || selectedExpense.rangeId) {
    return { rangedSyncPromise: editRangedData(params) };
  }
  await editSingleData(params);
  return { rangedSyncPromise: null };
}

async function editSingleData({
  tripid,
  isOnline,
  expenseCtx,
  selectedExpense,
  selectedExpenseAuthorUid,
  expenseData,
}: EditExpenseParams): Promise<void> {
  expenseData.editedTimestamp = Date.now();
  const item: OfflineQueueManageExpenseItem = {
    type: "update",
    expense: {
      tripid,
      uid: selectedExpenseAuthorUid,
      expenseData,
      id: selectedExpense.id,
    },
  };
  expenseCtx.updateExpense(selectedExpense.id!, expenseData);
  await updateExpenseOnlineOffline(item, isOnline);
}

function editRangedData(params: EditExpenseParams): Promise<void> {
  const {
    tripid,
    uid,
    isOnline,
    expenseCtx,
    selectedExpense,
    selectedExpenseAuthorUid,
    expenseData,
    newRangeId,
  } = params;
  const rangedPersistParams = { tripid, uid, isOnline, expenseCtx };
  const expensesInRange = expenseCtx.expenses.filter(
    (expense) => expense.rangeId && expense.rangeId === selectedExpense.rangeId
  );

  if (expensesInRange.length === 0) {
    expenseCtx.deleteExpense(selectedExpense.id!);
    const item: OfflineQueueManageExpenseItem = {
      type: "delete",
      expense: { tripid, uid: selectedExpenseAuthorUid, id: selectedExpense.id },
    };
    const deleteSync = deleteExpenseOnlineOffline(item, isOnline);
    const instances = planNonRangedToRangedInstances(expenseData, newRangeId());
    const addSync = persistRangedExpenseAdd(
      instances,
      rangedPersistParams
    ).syncPromise;
    return Promise.all([deleteSync, addSync]).then(() => {});
  }

  if (shouldReplaceRangedExpenseInstances(expensesInRange, expenseData)) {
    const deleteTargets = collectUserDeleteTargets(
      tripid,
      expenseCtx.expenses,
      [selectedExpense.id!]
    );
    const instances = planRangedExpenseReplacement(expenseData, newRangeId());
    return persistRangedExpenseReplace(
      deleteTargets,
      instances,
      rangedPersistParams
    ).syncPromise;
  }

  const updates = planRangedExpenseInPlaceUpdates(expenseData, expensesInRange);
  return persistRangedExpenseInPlaceEdit(updates, {
    ...rangedPersistParams,
    uid: selectedExpenseAuthorUid,
  }).syncPromise;
}
