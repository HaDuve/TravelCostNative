import type { ExpenseData } from "./expense";
import {
  deleteExpenseWithRetryAndQueue,
  OfflineQueueManageExpenseItem,
  storeExpenseWithRetryAndQueue,
  updateExpenseWithRetryAndQueue,
} from "./offline-queue";
import type { UserDeleteExpenseTarget } from "./user-delete-expense";
import {
  buildExpenseEditEntry,
  buildSplitHistoryEntry,
  type SplitHistoryAuthor,
  type SplitHistoryEntry,
} from "./split-history";

/** What split history needs to describe ranged changes. */
export interface RangedHistoryContext {
  /** The trip's active expenses before the change. */
  expenses: ExpenseData[];
  tripCurrency: string;
  isPaidTimestamp?: number;
  author: SplitHistoryAuthor;
}

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
  /** When given, ranged changes also write split history entries. */
  history?: RangedHistoryContext;
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
  { tripid, uid, isOnline, history }: RangedExpensePersistParams,
  /** Replace flow: one edit entry rides on the first add instead of one entry per day. */
  firstItemEntry?: SplitHistoryEntry | null,
): Promise<void> {
  for (const [index, expenseData] of expenses.entries()) {
    const historyEntry = firstItemEntry !== undefined
      ? index === 0
        ? firstItemEntry
        : null
      : history
        ? buildSplitHistoryEntry({
            kind: "added",
            description: expenseData.description,
            before: [],
            after: [expenseData],
            tripCurrency: history.tripCurrency,
            isPaidTimestamp: history.isPaidTimestamp,
            author: history.author,
          })
        : null;
    const item: OfflineQueueManageExpenseItem = {
      type: "add",
      expense: {
        tripid,
        uid,
        id: expenseData.id,
        expenseData,
      },
      ...(historyEntry ? { historyEntry } : {}),
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
  { tripid, uid, isOnline, history }: RangedExpensePersistParams,
): Promise<void> {
  for (const { id, expenseData } of updates) {
    const previous = history?.expenses.find((e) => e.id === id);
    const historyEntry =
      history && previous
        ? buildExpenseEditEntry({
            before: previous,
            after: expenseData,
            tripCurrency: history.tripCurrency,
            isPaidTimestamp: history.isPaidTimestamp,
            author: history.author,
          })
        : null;
    const item: OfflineQueueManageExpenseItem = {
      type: "update",
      expense: {
        tripid,
        uid,
        id,
        expenseData,
      },
      ...(historyEntry ? { historyEntry } : {}),
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

  const { history } = params;
  const targetIds = new Set(deleteTargets.map((t) => t.id));
  const replaced = history?.expenses.filter((e) => e.id && targetIds.has(e.id));
  const replaceEntry =
    history && replaced
      ? buildSplitHistoryEntry({
          kind: "edited",
          description: prepared[0]?.description ?? replaced[0]?.description ?? "",
          before: replaced,
          after: prepared,
          tripCurrency: history.tripCurrency,
          isPaidTimestamp: history.isPaidTimestamp,
          author: history.author,
        })
      : null;

  return {
    syncPromise: (async () => {
      await syncRangedDeletes(deleteTargets, params.isOnline);
      await syncRangedAdds(prepared, params, history ? replaceEntry : undefined);
    })(),
  };
}
