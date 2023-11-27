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
import { getMMKVObject } from "../store/mmkv";
import safeLogError from "./error";

// interface of offline queue manage expense item
export interface OfflineQueueManageExpenseItem {
  timeStamp?: string;
  type: "add" | "update" | "delete";
  expense: Expense;
}

// retrieve offlinequeue and push new item
export const pushOfflineQueue = async (item: OfflineQueueManageExpenseItem) => {
  const offlineQueue = await getOfflineQueue();
  offlineQueue.push(item);
  const res = await secureStoreSetObject("offlineQueue", offlineQueue);
  console.log("pushOfflineQueue ~ offlineQueue:", offlineQueue);
  return res;
};

// retrieve offlinequeue and push new item, return random id
export const pushQueueReturnRndID = async (
  item: OfflineQueueManageExpenseItem
) => {
  try {
    await pushOfflineQueue(item);
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  } catch (error) {
    safeLogError(error);
    throw new Error("pushQueueReturnRndID failed");
  }
};

// retrieve offlinequeue
export const getOfflineQueue = async () => {
  const offlineQueue = await secureStoreGetObject("offlineQueue");
  if (!offlineQueue) {
    console.log("retrieved no OfflineQueue!");
  }
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
  // const { isFastEnough, speed } = await isConnectionFastEnough();
  const netInfo = await NetInfo.fetch();
  const reachable = netInfo.isConnected && netInfo.isInternetReachable;
  console.log("reachable:", reachable);
  if (online && reachable) {
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
  const { isFastEnough, speed } = await isConnectionFastEnough();
  // console.log("isFastEnough:", isFastEnough);
  // console.log("speed:", speed.toFixed(2), "Mbps");
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
      return await pushQueueReturnRndID(item);
    }
  } else {
    // store item offline
    return await pushQueueReturnRndID(item);
  }
};

/**
 * This function sends offline queue data to the server when the device is back online and the internet connection is fast enough.
 * It retrieves the offline queue data from the secure store and sends each item in a while loop.
 * If the internet connection is not fast enough or the device is still offline, the function returns without sending any data.
 * If any item in the queue fails to send, the function stops sending and returns an error.
 * @async
 * @function sendOfflineQueue
 * @returns {Promise<void>}
 */
// global.sendingOfflineQueue = false;
export const sendOfflineQueue = async () => {
  // mutex
  // if (global.sendingOfflineQueue) {
  //   console.log("sendOfflineQueue ~ already sending");
  //   return;
  // }
  // global.sendingOfflineQueue = true;
  // try {
  const offlineQueue = (await secureStoreGetObject("offlineQueue")) || [];

  if (offlineQueue && offlineQueue?.length > 0) {
    // console.log("queue length", offlineQueue?.length);
    const forceOffline = !Device.isDevice && DEBUG_FORCE_OFFLINE;
    const isOnline = await NetInfo.fetch();
    // console.log("update connected =", isOnline);
    // if the internet is not fast enough, store in offline queue
    const { isFastEnough, speed } = await isConnectionFastEnough();
    // console.log("isFastEnough:", isFastEnough);
    // console.log("speed:", speed.toFixed(2), "Mbps");

    if (!isOnline || !isOnline.isConnected || !isFastEnough || forceOffline) {
      console.log(
        "sendOfflineQueue ~ still offline! Length:",
        offlineQueue?.length
      );
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
      const item = offlineQueue[i];
      tripid = item.expense.tripid;

      // console.log("sendOfflineQueue ~ item:", item);
      console.log("sendOfflineQueue ~ item.type:", item.type);

      try {
        if (item.type === "add") {
          const oldId = item.expense.id;
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
            item2.expense.id = id;
          }
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
          console.log("unknown offlineQ item type");
        }

        // Add the processed item to the list
        processedItems.push(item);
        i++;
      } catch (error) {
        console.error("offlineQ error:", error);
        break;
      }
    }

    // Remove the processed items from the queue
    const remainingItems = offlineQueue.slice(i);
    console.log("sendOfflineQueue ~ remainingItems:", remainingItems);
    await secureStoreSetObject("offlineQueue", remainingItems);
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
  } else {
    // console.log("no queue");
  }
  // } catch (error) {
  //   global.sendingOfflineQueue = false;
  // }
  // global.sendingOfflineQueue = false;
};
