import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetObject,
} from "../store/async-storage";
import { Expense, ExpenseData } from "./expense";
import {
  storeExpense,
  updateExpense,
  deleteExpense,
  touchAllTravelers,
} from "./http";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Toast from "react-native-toast-message";
import * as Device from "expo-device";
import { DEBUG_FORCE_OFFLINE } from "../confAppConstants";

import NetInfo from "@react-native-community/netinfo";
import { isConnectionFastEnough } from "./connectionSpeed";
import {
  secureStoreGetItem,
  secureStoreGetObject,
  secureStoreSetObject,
} from "../store/secure-storage";
import { getMMKVObject, setMMKVObject } from "../store/mmkv";
import safeLogError from "./error";
import set from "react-native-reanimated";

// interface of offline queue manage expense item
export interface OfflineQueueManageExpenseItem {
  timeStamp?: string;
  type: "add" | "update" | "delete";
  expense: Expense;
}

// retrieve offlinequeue and push new item
export const pushOfflineQueue = async (item: OfflineQueueManageExpenseItem) => {
  const offlineQueue = getOfflineQueue();
  offlineQueue.push(item);
  const res = setMMKVObject("offlineQueue", offlineQueue);
  return res;
};

// retrieve offlinequeue and push new item, return random id
export const pushQueueReturnRndID = async (
  item: OfflineQueueManageExpenseItem
) => {
  try {
    const id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    if (item.type == "add") item.expense.id = id;
    await pushOfflineQueue(item);
    return id;
  } catch (error) {
    safeLogError(error);
    throw new Error("pushQueueReturnRndID failed");
  }
};

// retrieve offlinequeue
export const getOfflineQueue = () => {
  const offlineQueue = getMMKVObject("offlineQueue");
  return offlineQueue || [];
};

/**
 * Deletes an expense either online or offline based on the provided parameters.
 * @async
 * @param {OfflineQueueManageExpenseItem} item - The expense item to be deleted.
 * @param {boolean} online - A boolean value indicating whether the deletion should be performed online or offline.
 * @throws {Error} Throws an error if no tripid is found in asyncStore.
 * @returns {Promise<void>} Returns a Promise that resolves when the deletion is complete.
 */
export const deleteExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await secureStoreGetItem("currentTripId");
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorDeleteExp"),
    });
    throw new Error(
      "No tripid found in asyncStore! (storeExpenseOnlineOffline)"
    );
  }
  item.expense.tripid = tripid;

  // if the internet is not fast enough, store in offline queue
  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    // delete item online
    try {
      await deleteExpense(
        item.expense.tripid,
        item.expense.uid,
        item.expense.id
      );
    } catch (error) {
      await pushQueueReturnRndID(item);
    }
  } else {
    // delete item offline
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
  online = true
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await secureStoreGetItem("currentTripId");
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorUpdateExp"),
    });
    throw new Error(
      "No tripid found in asyncStore! (storeExpenseOnlineOffline)"
    );
  }
  item.expense.tripid = tripid;
  // if the internet is not fast enough, store in offline queue
  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    // update item online
    try {
      await updateExpense(
        item.expense.tripid,
        item.expense.uid,
        item.expense.id,
        item.expense.expenseData
      );
    } catch (error) {
      await pushQueueReturnRndID(item);
    }
  } else {
    // update item offline
    await pushQueueReturnRndID(item);
  }
};

/**
 * This function stores an expense either online or offline based on the internet speed and availability.
 * @param {OfflineQueueManageExpenseItem} item - The expense item to be stored.
 * @param {boolean} online - A boolean value indicating whether the device is online or not.
 * @returns {Promise<string>} - A promise that resolves to the ID of the stored expense.
 * @throws {Error} - If there is no trip ID found in the async store.
 */
export const storeExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean,
  forceTripid = null
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = forceTripid ?? (await secureStoreGetItem("currentTripId"));
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastErrorStoreExp"),
    });
    throw new Error(
      "No tripid found in asyncStore! (storeExpenseOnlineOffline)"
    );
  }
  item.expense.tripid = tripid;
  // if the internet is not fast enough, store in offline queue
  const { isFastEnough } = await isConnectionFastEnough();
  if (online && isFastEnough) {
    // store item online
    try {
      const id = await storeExpense(
        item.expense.tripid,
        item.expense.uid,
        item.expense.expenseData
      );
      return id;
    } catch (error) {
      safeLogError("error1:" + error);
      const id = await pushQueueReturnRndID(item);
      // console.log("debugOQ id:", id);
      return id;
    }
  } else {
    // store item offline
    safeLogError("error2");
    const id = await pushQueueReturnRndID(item);
    return id;
  }
};

/**
 * Sends the offline queue of items for processing.
 *
 * @param mutexBool - A boolean indicating whether the mutex is active.
 * @param setMutexFunction - A function to set the value of the mutex.
 * @returns A Promise that resolves when the offline queue is processed.
 */
export async function sendOfflineQueue(
  mutexBool: boolean,
  setMutexFunction: (mutexBool: boolean) => void
) {
  if (mutexBool) {
    return;
  }
  if (setMutexFunction) setMutexFunction(true);
  let offlineQueue = getMMKVObject("offlineQueue") || [];

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
      offlineQueue = getMMKVObject("offlineQueue") || [];
      const item = offlineQueue[i];
      tripid = item.expense.tripid;

      try {
        if (item.type === "add") {
          const oldId = item.expense.id || item.expense.expenseData.id || null;
          const id = await storeExpense(
            item.expense.tripid,
            item.expense.uid,
            item.expense.expenseData
          );
          item.expense.id = id;
          // change item.expense.id for every other item.type == "update" or "delete" in the queue
          for (let j = i + 1; j < offlineQueue?.length - i; j++) {
            const item2 = offlineQueue[j];
            if (!item2 || item2.expense.id !== oldId || item2.type === "add")
              continue;
            offlineQueue[j].expense.id = id;
          }
          setMMKVObject("offlineQueue", offlineQueue);
        } else if (item.type === "update") {
          await updateExpense(
            item.expense.tripid,
            item.expense.uid,
            item.expense.id,
            item.expense.expenseData
          );
        } else if (item.type === "delete") {
          await deleteExpense(
            item.expense.tripid,
            item.expense.uid,
            item.expense.id
          );
        } else {
          // console.log("unknown offlineQ item type");
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
    setMMKVObject("offlineQueue", remainingItems);
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
