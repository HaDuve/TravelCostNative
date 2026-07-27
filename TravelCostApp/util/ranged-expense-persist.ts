import type { ExpenseData } from "./expense";
import {
  deleteExpenseWithRetryAndQueue,
  OfflineQueueManageExpenseItem,
  storeExpenseWithRetryAndQueue,
  updateExpenseWithRetryAndQueue,
} from "./offline-queue";
import type { UserDeleteExpenseTarget } from "./user-delete-expense";

export interface RangedExpensePersistContext {
  addExpense: (expense: ExpenseData) => void;
  updateExpense: (id: string, expenseData: ExpenseData) => void;
  deleteExpense: (id: string) => void;
  updateExpenseId?: (oldId: string, newId: string) => void;
}

export interface RangedExpensePersistParams {
  tripid: string;
  uid: string;
  isOnline: boolean;
  expenseCtx: RangedExpensePersistContext;
}

const assignClientIds = (instances: ExpenseData[], editedTimestamp: number) =>
  instances.map((instance) => {
    const id =
      instance.id ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    return {
      ...instance,
      id,
      editedTimestamp,
    };
  });

async function syncRangedAdds(
  expenses: ExpenseData[],
  { tripid, uid, isOnline }: RangedExpensePersistParams,
): Promise<void> {
  for (const expenseData of expenses) {
    const item: OfflineQueueManageExpenseItem = {
      type: "add",
      expense: {
        tripid,
        uid,
        id: expenseData.id,
        expenseData,
      },
    };
    await storeExpenseWithRetryAndQueue(item, isOnline);
  }
}

export function persistRangedExpenseAdd(
  instances: ExpenseData[],
  params: RangedExpensePersistParams,
): { syncPromise: Promise<void> } {
  const editedTimestamp = Date.now();
  const prepared = assignClientIds(instances, editedTimestamp);

  for (const expense of prepared) {
    params.expenseCtx.addExpense(expense);
  }

  return {
    syncPromise: syncRangedAdds(prepared, params),
  };
}

export type RangedExpenseInPlaceUpdate = {
  id: string;
  expenseData: ExpenseData;
};

async function syncRangedInPlaceUpdates(
  updates: RangedExpenseInPlaceUpdate[],
  { tripid, uid, isOnline }: RangedExpensePersistParams,
): Promise<void> {
  for (const { id, expenseData } of updates) {
    const item: OfflineQueueManageExpenseItem = {
      type: "update",
      expense: {
        tripid,
        uid,
        id,
        expenseData,
      },
    };
    await updateExpenseWithRetryAndQueue(item, isOnline);
  }
}

export function persistRangedExpenseInPlaceEdit(
  updates: RangedExpenseInPlaceUpdate[],
  params: RangedExpensePersistParams,
): { syncPromise: Promise<void> } {
  for (const { id, expenseData } of updates) {
    params.expenseCtx.updateExpense(id, expenseData);
  }

  return {
    syncPromise: syncRangedInPlaceUpdates(updates, params),
  };
}

async function syncRangedDeletes(
  targets: UserDeleteExpenseTarget[],
  isOnline: boolean,
): Promise<void> {
  for (const target of targets) {
    const item: OfflineQueueManageExpenseItem = {
      type: "delete",
      expense: {
        tripid: target.tripid,
        uid: target.uid,
        id: target.id,
      },
    };
    await deleteExpenseWithRetryAndQueue(item, isOnline);
  }
}

export function persistRangedExpenseReplace(
  deleteTargets: UserDeleteExpenseTarget[],
  newInstances: ExpenseData[],
  params: RangedExpensePersistParams,
): { syncPromise: Promise<void> } {
  for (const target of deleteTargets) {
    params.expenseCtx.deleteExpense(target.id);
  }

  const editedTimestamp = Date.now();
  const prepared = assignClientIds(newInstances, editedTimestamp);
  for (const expense of prepared) {
    params.expenseCtx.addExpense(expense);
  }

  return {
    syncPromise: (async () => {
      await syncRangedDeletes(deleteTargets, params.isOnline);
      await syncRangedAdds(prepared, params);
    })(),
  };
}
