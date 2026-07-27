import { Expense } from "./expense";
import {
  storeExpense,
  storeExpenseWithId,
  updateExpense,
  deleteExpense,
  restoreExpense,
  touchAllTravelers,
} from "./http";

import { i18n } from "../i18n/i18n";

import Toast from "react-native-toast-message";
import * as Device from "expo-device";
import { DEBUG_FORCE_OFFLINE } from "../confAppConstants";

import NetInfo from "@react-native-community/netinfo";
import { isConnectionFastEnough } from "./connectionSpeed";
import { secureStoreGetItem } from "../store/secure-storage";
import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "../store/mmkv";
import safeLogError from "./error";
import { withRetries } from "./sync-with-retries";

// interface of offline queue manage expense item
export interface OfflineQueueManageExpenseItem {
  timeStamp?: string;
  type: "add" | "update" | "delete" | "restore";
  expense: Expense;
}

const generateExpenseId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const ensureAddItemId = (item: OfflineQueueManageExpenseItem) => {
  if (item.type !== "add") return item.expense.id;
  if (item.expense.id) {
    if (item.expense.expenseData && !item.expense.expenseData.id) {
      item.expense.expenseData.id = item.expense.id;
    }
    return item.expense.id;
  }
  const id = generateExpenseId();
  item.expense.id = id;
  if (item.expense.expenseData) {
    item.expense.expenseData.id = id;
  }
  return id;
};

// retrieve offlinequeue and push new item
export const offlineQueuePushItem = (item: OfflineQueueManageExpenseItem) => {
  const offlineQueue = getOfflineQueue();
  offlineQueue.push(item);
  setMMKVObject(MMKV_KEYS.OFFLINE_QUEUE, offlineQueue);
};

// retrieve offlinequeue and push new item, return random id
export const pushQueueReturnRndID = async (
  item: OfflineQueueManageExpenseItem,
) => {
  try {
    const id = ensureAddItemId(item);
    offlineQueuePushItem(item);
    return id;
  } catch (error) {
    safeLogError(error);
    throw new Error("pushQueueReturnRndID failed");
  }
};

// retrieve offlinequeue
export const getOfflineQueue = () => {
  const offlineQueue = getMMKVObject(MMKV_KEYS.OFFLINE_QUEUE);
  return offlineQueue || [];
};

/** Drops a queued delete for this expense id; returns true if one was removed. */
export const removePendingDeleteFromOfflineQueue = (
  expenseId: string,
): boolean => {
  const offlineQueue = getOfflineQueue();
  const filtered = offlineQueue.filter(
    (item: OfflineQueueManageExpenseItem) =>
      !(item.type === "delete" && item.expense.id === expenseId),
  );
  if (filtered.length === offlineQueue.length) {
    return false;
  }
  setMMKVObject(MMKV_KEYS.OFFLINE_QUEUE, filtered);
  return true;
};

const resolveTripidOrThrow = async (
  item: OfflineQueueManageExpenseItem,
  errorMessage: string,
  toastKey: "toastErrorStoreExp" | "toastErrorUpdateExp" | "toastErrorDeleteExp",
) => {
  const tripid = await secureStoreGetItem("currentTripId");
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t(toastKey),
    });
    throw new Error(errorMessage);
  }
  item.expense.tripid = tripid;
  return tripid;
};

const attemptStoreExpenseOnline = async (
  item: OfflineQueueManageExpenseItem,
): Promise<string> => {
  const expenseId = ensureAddItemId(item);
  if (expenseId && item.expense.expenseData) {
    await storeExpenseWithId(
      item.expense.tripid,
      item.expense.uid,
      expenseId,
      item.expense.expenseData,
    );
    return expenseId;
  }
  return storeExpense(
    item.expense.tripid,
    item.expense.uid,
    item.expense.expenseData,
  );
};

const attemptUpdateExpenseOnline = async (
  item: OfflineQueueManageExpenseItem,
): Promise<void> => {
  await updateExpense(
    item.expense.tripid,
    item.expense.uid,
    item.expense.id,
    item.expense.expenseData,
  );
};

const attemptDeleteExpenseOnline = async (
  item: OfflineQueueManageExpenseItem,
): Promise<void> => {
  await deleteExpense(
    item.expense.tripid,
    item.expense.uid,
    item.expense.id,
  );
};

/**
 * Deletes an expense either online or offline based on the provided parameters.
 */
export const deleteExpenseWithRetryAndQueue = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean,
): Promise<void> => {
  await resolveTripidOrThrow(
    item,
    "No tripid found in asyncStore! (deleteExpenseWithRetryAndQueue)",
    "toastErrorDeleteExp",
  );

  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    try {
      await withRetries(() => attemptDeleteExpenseOnline(item));
      return;
    } catch (error) {
      safeLogError("deleteExpenseWithRetryAndQueue online failed: " + error);
    }
  }

  try {
    await pushQueueReturnRndID(item);
  } catch (error) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorDeleteExp"),
    });
    throw error;
  }
};

export const deleteExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean,
): Promise<void> => {
  await resolveTripidOrThrow(
    item,
    "No tripid found in asyncStore! (deleteExpenseOnlineOffline)",
    "toastErrorDeleteExp",
  );

  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    try {
      await attemptDeleteExpenseOnline(item);
      return;
    } catch (error) {
      await pushQueueReturnRndID(item);
    }
  } else {
    await pushQueueReturnRndID(item);
  }
};

/**
 * Restores a soft-deleted expense on the server or offline queue (mirrors deleteExpenseOnlineOffline).
 *
 * Callers must also clear the local tombstone via `restoreExpense` / `restoreExpenses` on expenses
 * context and call `touchAllTravelers` after a successful restore — same three-step pattern as delete.
 *
 * Queue-first: if a pending queued `delete` exists for this expense id, only that queue entry is
 * removed (no network). Local `isDeleted` is not cleared here.
 */
export const restoreExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean,
) => {
  const tripid = await secureStoreGetItem("currentTripId");
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorRestoreExp"),
    });
    throw new Error(
      "No tripid found in secure store! (restoreExpenseOnlineOffline)",
    );
  }
  item.expense.tripid = tripid;

  if (removePendingDeleteFromOfflineQueue(item.expense.id)) {
    return;
  }

  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    try {
      const response = await restoreExpense(
        item.expense.tripid,
        item.expense.uid,
        item.expense.id,
      );
      if (!response) {
        await pushQueueReturnRndID(item);
      }
    } catch (error) {
      await pushQueueReturnRndID(item);
    }
  } else {
    await pushQueueReturnRndID(item);
  }
};

/**
 * Updates an expense item either online or offline depending on the internet connection speed.
 * @async
 * @param {OfflineQueueManageExpenseItem} item - The expense item to be updated.
 * @param {boolean} online - A boolean value indicating whether the device is currently online or not.
 * @throws {Error} Throws an error if there is no tripid found in asyncStore.
 * @returns {Promise<void>} Returns a Promise that resolves when the update is complete.
 */
export const updateExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online = true,
): Promise<void> => {
  await resolveTripidOrThrow(
    item,
    "No tripid found in asyncStore! (updateExpenseOnlineOffline)",
    "toastErrorUpdateExp",
  );

  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    try {
      await attemptUpdateExpenseOnline(item);
      return;
    } catch (error) {
      await pushQueueReturnRndID(item);
    }
  } else {
    await pushQueueReturnRndID(item);
  }
};

export const storeExpenseWithRetryAndQueue = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean,
): Promise<string> => {
  await resolveTripidOrThrow(
    item,
    "No tripid found in asyncStore! (storeExpenseWithRetryAndQueue)",
    "toastErrorStoreExp",
  );
  ensureAddItemId(item);

  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    try {
      return await withRetries(() => attemptStoreExpenseOnline(item));
    } catch (error) {
      safeLogError("storeExpenseWithRetryAndQueue online failed: " + error);
    }
  }

  try {
    return await pushQueueReturnRndID(item);
  } catch (error) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorStoreExp"),
    });
    throw error;
  }
};

export const updateExpenseWithRetryAndQueue = async (
  item: OfflineQueueManageExpenseItem,
  online = true,
): Promise<void> => {
  await resolveTripidOrThrow(
    item,
    "No tripid found in asyncStore! (updateExpenseWithRetryAndQueue)",
    "toastErrorUpdateExp",
  );

  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    try {
      await withRetries(() => attemptUpdateExpenseOnline(item));
      return;
    } catch (error) {
      safeLogError("updateExpenseWithRetryAndQueue online failed: " + error);
    }
  }

  try {
    await pushQueueReturnRndID(item);
  } catch (error) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorUpdateExp"),
    });
    throw error;
  }
};

/**
 * Stores an expense online with retries, or queues it when offline or after failures.
 */
export const storeExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean,
  forceTripid: string | null = null,
): Promise<string> => {
  const tripid = forceTripid ?? (await secureStoreGetItem("currentTripId"));
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorStoreExp"),
    });
    throw new Error(
      "No tripid found in asyncStore! (storeExpenseOnlineOffline)",
    );
  }
  item.expense.tripid = tripid;
  ensureAddItemId(item);

  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    try {
      return await attemptStoreExpenseOnline(item);
    } catch (error) {
      safeLogError("error1: could not store expense " + error);
      return pushQueueReturnRndID(item);
    }
  }

  safeLogError("error2 : network is not online && fast enough");
  return pushQueueReturnRndID(item);
};

/**
 * Sends the offline queue of items for processing.
 *
 * @param mutexBool - A boolean indicating whether the mutex is active.
 * @param setMutexFunction - A function to set the value of the mutex.
 * @param expensesContext - Optional expenses context to update local expense IDs after sync.
 * @returns A Promise that resolves when the offline queue is processed.
 */
export async function sendOfflineQueue(
  mutexBool: boolean,
  setMutexFunction: (mutexBool: boolean) => void,
  expensesContext?: { updateExpenseId: (oldId: string, newId: string) => void },
) {
  if (mutexBool) {
    return;
  }
  if (setMutexFunction) setMutexFunction(true);
  let offlineQueue = getMMKVObject(MMKV_KEYS.OFFLINE_QUEUE) || [];

  if (offlineQueue && offlineQueue?.length > 0) {
    const forceOffline = !Device.isDevice && DEBUG_FORCE_OFFLINE;
    const isOnline = await NetInfo.fetch();
    // if the internet is not fast enough, store in offline queue
    const { isFastEnough } = await isConnectionFastEnough();

    if (!isOnline || !isOnline.isConnected || !isFastEnough || forceOffline) {
      if (setMutexFunction) setMutexFunction(false);
      return;
    }
    // indicate loading
    Toast.hide();
    Toast.show({
      type: "loading",
      text1: i18n.t("toastSyncChanges1"),
      text2: i18n.t("toastSyncChanges2"),
      autoHide: false,
    });

    // send items in while loop
    const processedItems = [];
    let i = 0;
    let tripid = "";

    while (i < offlineQueue?.length) {
      offlineQueue = getMMKVObject(MMKV_KEYS.OFFLINE_QUEUE) || [];
      const item = offlineQueue[i];
      tripid = item.expense.tripid;

      try {
        if (item.type === "add") {
          const oldId = item.expense.id || item.expense.expenseData?.id || null;
          if (!item.expense.id && item.expense.expenseData?.id) {
            item.expense.id = item.expense.expenseData.id;
          }
          const ensuredId = ensureAddItemId(item);
          if (!ensuredId || !item.expense.expenseData) {
            i++;
            continue;
          }

          const id = await storeExpenseWithId(
            item.expense.tripid,
            item.expense.uid,
            ensuredId,
            item.expense.expenseData,
          );

          item.expense.id = id;

          // Update local expense ID if expenses context is provided
          if (oldId && id && oldId !== id && expensesContext?.updateExpenseId) {
            try {
              expensesContext.updateExpenseId(oldId, id);
            } catch (error) {
              safeLogError("Failed to update expense ID in context: " + error);
            }
          }

          if (oldId && id && oldId !== id) {
            // change item.expense.id for every other item.type == "update" or "delete" in the queue
            for (let j = i + 1; j < offlineQueue?.length - i; j++) {
              const item2 = offlineQueue[j];
              if (!item2 || item2.expense.id !== oldId || item2.type === "add")
                continue;
              offlineQueue[j].expense.id = id;
            }
            setMMKVObject(MMKV_KEYS.OFFLINE_QUEUE, offlineQueue);
          }
        } else if (item.type === "update") {
          await updateExpense(
            item.expense.tripid,
            item.expense.uid,
            item.expense.id,
            item.expense.expenseData,
          );
        } else if (item.type === "delete") {
          await deleteExpense(
            item.expense.tripid,
            item.expense.uid,
            item.expense.id,
          );
        } else if (item.type === "restore") {
          await restoreExpense(
            item.expense.tripid,
            item.expense.uid,
            item.expense.id,
          );
        } else {
          safeLogError("unknown offlineQ item type", "offline-queue.ts");
        }
        processedItems.push(item);
        i++;
      } catch (error) {
        safeLogError(error);
        break;
      }
    }

    // Remove the processed items from the queue
    const remainingItems = offlineQueue.slice(i);
    setMMKVObject(MMKV_KEYS.OFFLINE_QUEUE, remainingItems);
    Toast.hide();
    if (processedItems?.length > 0) {
      await touchAllTravelers(tripid, true);
      Toast.show({
        type: "success",
        text1: i18n.t("toastSyncFinished1"),
        text2: `${i18n.t("toastSyncFinished21")} ${processedItems?.length}/${
          offlineQueue?.length
        } ${i18n.t("toastSyncFinished22")}`,
      });
    }
  }
  if (setMutexFunction) setMutexFunction(false);
}
