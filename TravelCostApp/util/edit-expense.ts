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
  type RangedHistoryContext,
} from "./ranged-expense-persist";
import {
  buildExpenseEditEntry,
  buildSplitHistoryEntry,
} from "./split-history";
import { collectUserDeleteTargets } from "./user-delete-expense";

/**
 * Applies the submit-time **Expense currency** rate (Trip currency per
 * Expense currency unit) to a submitted Expense: derives `calcAmount`, stamps the
 * rate on every **Split** row, and clears the Split list for SELF Splits.
 * Mutates `expenseData` in place (as the Expense form submit path always did)
 * and returns nothing.
 */
export function applySubmitRate(expenseData: ExpenseData, rate: number): void {
  expenseData.calcAmount = expenseData.amount / rate;
  expenseData.splitList?.forEach((split) => {
    split.rate = rate;
  });
  if (expenseData.splitType === "SELF") {
    expenseData.splitList = [];
  }
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
  /** When given, edits also write split history entries. */
  history?: RangedHistoryContext;
}

function spansMultipleDays(expenseData: ExpenseData): boolean {
  // A missing start or end date means a single-day Expense (isSameDay returns
  // false for a falsy date, which must not read as "spans multiple days").
  if (!expenseData.startDate || !expenseData.endDate) return false;
  return !isSameDay(expenseData.endDate, expenseData.startDate);
}

/**
 * Saves an edited Expense. Every path leaves the trip equal to deleting the old
 * Expense (whole range) and adding the edited one from scratch.
 * Resolves with `rangedSyncPromise`: `null` for a single-day edit (its sync was
 * already awaited), or, for a **Ranged expense** edit, the still-pending sync,
 * which is deliberately NOT awaited here (the UI stays responsive; the caller
 * decides whether to await it, e.g. to notify Travellers afterwards).
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
  history,
}: EditExpenseParams): Promise<void> {
  expenseData.editedTimestamp = Date.now();
  const historyEntry = history
    ? buildExpenseEditEntry({
        before: selectedExpense,
        after: { ...expenseData, id: selectedExpense.id },
        ...history,
      })
    : null;
  const item: OfflineQueueManageExpenseItem = {
    type: "update",
    expense: {
      tripid,
      uid: selectedExpenseAuthorUid,
      expenseData,
      id: selectedExpense.id,
    },
    ...(historyEntry ? { historyEntry } : {}),
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
    history,
  } = params;
  const rangedPersistParams = { tripid, uid, isOnline, expenseCtx, history };
  const expensesInRange = expenseCtx.expenses.filter(
    (expense) => expense.rangeId && expense.rangeId === selectedExpense.rangeId
  );

  if (expensesInRange.length === 0) {
    expenseCtx.deleteExpense(selectedExpense.id!);
    const item: OfflineQueueManageExpenseItem = {
      type: "delete",
      expense: { tripid, uid: selectedExpenseAuthorUid, id: selectedExpense.id },
    };
    const instances = planNonRangedToRangedInstances(expenseData, newRangeId());
    // One edit entry (old single expense -> new days) rides on the delete.
    const replaceEntry = history
      ? buildSplitHistoryEntry({
          kind: "edited",
          description: expenseData.description,
          before: [selectedExpense],
          after: instances,
          ...history,
        })
      : null;
    if (replaceEntry) item.historyEntry = replaceEntry;
    const deleteSync = deleteExpenseOnlineOffline(item, isOnline);
    const addSync = persistRangedExpenseAdd(instances, {
      ...rangedPersistParams,
      history: undefined,
    }).syncPromise;
    return Promise.all([deleteSync, addSync]).then(() => undefined);
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
