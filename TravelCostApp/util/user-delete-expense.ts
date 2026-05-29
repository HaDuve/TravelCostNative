import Toast from "react-native-toast-message";
import { i18n } from "../i18n/i18n";
import { touchAllTravelers } from "./http";
import type { ExpenseData } from "./expense";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
  restoreExpenseOnlineOffline,
} from "./offline-queue";

export const UNDO_DELETE_WINDOW_MS = 8000;

export type UserDeleteExpenseTarget = {
  tripid: string;
  uid: string;
  id: string;
};

type PendingUndoDelete = {
  actionId: string;
  expiresAt: number;
  tripid: string;
  targets: UserDeleteExpenseTarget[];
};

export interface UserDeleteExpenseContext {
  deleteExpense: (id: string) => void;
  restoreExpenses: (ids: string[]) => void;
}

let pendingUndoDelete: PendingUndoDelete | null = null;
let undoExpiryTimer: ReturnType<typeof setTimeout> | null = null;
let dismissToastClearsUndo = true;

export function clearPendingUndoDelete(): void {
  pendingUndoDelete = null;
  if (undoExpiryTimer) {
    clearTimeout(undoExpiryTimer);
    undoExpiryTimer = null;
  }
}

/** One undo scope per user delete action; expands ranged selections to all days. */
export function collectUserDeleteTargets(
  tripid: string,
  allExpenses: ExpenseData[],
  selectedIds: string[],
): UserDeleteExpenseTarget[] {
  const targetsById = new Map<string, UserDeleteExpenseTarget>();

  for (const expenseId of selectedIds) {
    const expense = allExpenses.find((item) => item.id === expenseId);
    if (!expense || expense.isDeleted || !expense.id || !expense.uid) {
      continue;
    }

    if (expense.rangeId) {
      for (const ranged of allExpenses) {
        if (
          ranged.rangeId === expense.rangeId &&
          !ranged.isDeleted &&
          ranged.id &&
          ranged.uid
        ) {
          targetsById.set(ranged.id, {
            tripid,
            uid: ranged.uid,
            id: ranged.id,
          });
        }
      }
    } else {
      targetsById.set(expense.id, {
        tripid,
        uid: expense.uid,
        id: expense.id,
      });
    }
  }

  return [...targetsById.values()];
}

export function isUndoDeleteAvailable(actionId: string): boolean {
  if (!pendingUndoDelete || pendingUndoDelete.actionId !== actionId) {
    return false;
  }
  return Date.now() < pendingUndoDelete.expiresAt;
}

function registerPendingUndoDelete(
  tripid: string,
  targets: UserDeleteExpenseTarget[],
): string {
  clearPendingUndoDelete();
  dismissToastClearsUndo = true;
  const actionId = `${Date.now()}-${targets.map((t) => t.id).join(",")}`;
  const expiresAt = Date.now() + UNDO_DELETE_WINDOW_MS;
  pendingUndoDelete = { actionId, expiresAt, tripid, targets };
  undoExpiryTimer = setTimeout(() => {
    clearPendingUndoDelete();
  }, UNDO_DELETE_WINDOW_MS);
  return actionId;
}

function showDeletedExpenseToast(
  actionId: string,
  onUndo: () => Promise<void>,
): void {
  Toast.show({
    type: "deletedExpense",
    text1: i18n.t("toastDeletedExpense1"),
    text2: i18n.t("toastDeletedExpense2"),
    visibilityTime: UNDO_DELETE_WINDOW_MS,
    autoHide: true,
    onHide: () => {
      if (dismissToastClearsUndo) {
        clearPendingUndoDelete();
      }
    },
    props: { actionId, onUndo },
  });
}

export async function deleteUserExpenses({
  tripid,
  targets,
  isOnline,
  expenseCtx,
  afterSync = () => touchAllTravelers(tripid, true),
  showUndoToast = true,
}: {
  tripid: string;
  targets: UserDeleteExpenseTarget[];
  isOnline: boolean;
  expenseCtx: Pick<UserDeleteExpenseContext, "deleteExpense">;
  afterSync?: () => Promise<void>;
  /** False for compound flows (e.g. ranged date edit) that are not a user delete action. */
  showUndoToast?: boolean;
}): Promise<void> {
  if (targets.length === 0) {
    return;
  }

  clearPendingUndoDelete();
  Toast.hide();
  Toast.show({
    type: "loading",
    text1: i18n.t("toastDeleting1"),
    text2: i18n.t("toastDeleting2"),
    autoHide: false,
  });

  try {
    for (const target of targets) {
      expenseCtx.deleteExpense(target.id);
    }

    for (const target of targets) {
      const item: OfflineQueueManageExpenseItem = {
        type: "delete",
        expense: {
          tripid: target.tripid,
          uid: target.uid,
          id: target.id,
        },
      };
      await deleteExpenseOnlineOffline(item, isOnline);
    }
  } finally {
    Toast.hide();
  }

  try {
    await afterSync();
  } catch {
    // Deletes already applied; undo toast remains the recovery path.
  }

  if (!showUndoToast) {
    return;
  }

  const actionId = registerPendingUndoDelete(tripid, targets);
  showDeletedExpenseToast(actionId, () => {
    dismissToastClearsUndo = false;
    return undoUserExpenseDelete({
      actionId,
      isOnline,
      expenseCtx,
      afterSync,
    });
  });
}

export async function undoUserExpenseDelete({
  actionId,
  isOnline,
  expenseCtx,
  afterSync,
}: {
  actionId: string;
  isOnline: boolean;
  expenseCtx: Pick<UserDeleteExpenseContext, "restoreExpenses">;
  afterSync?: () => Promise<void>;
}): Promise<void> {
  if (!isUndoDeleteAvailable(actionId)) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastUndoDeleteExpired"),
    });
    return;
  }

  const { targets, tripid } = pendingUndoDelete!;
  clearPendingUndoDelete();
  Toast.hide();

  try {
    for (const target of targets) {
      const item: OfflineQueueManageExpenseItem = {
        type: "restore",
        expense: {
          tripid: target.tripid,
          uid: target.uid,
          id: target.id,
        },
      };
      await restoreExpenseOnlineOffline(item, isOnline);
    }
    expenseCtx.restoreExpenses(targets.map((t) => t.id));
    if (afterSync) {
      await afterSync();
    } else {
      await touchAllTravelers(tripid, true);
    }
  } catch {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorRestoreExp"),
    });
  }
}
