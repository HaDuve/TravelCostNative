import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetObject,
} from "../store/async-storage";
import { Expense } from "./expense";
import {
  storeExpense,
  updateExpense,
  deleteExpense,
  touchAllTravelers,
} from "./http";
import Toast from "react-native-toast-message";
import * as Device from "expo-device";
import { DEBUG_FORCE_OFFLINE } from "../confAppConstants";

import NetInfo from "@react-native-community/netinfo";
import { isConnectionFastEnough } from "./connectionSpeed";
import {
  secureStoreGetObject,
  secureStoreSetObject,
} from "../store/secure-storage";

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

// delete item online if online flag is set, otherwise store in offline queue
export const deleteExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await secureStoreGetItem("currentTripId");
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Could not delete Expense, please try again!",
    });
    throw new Error(
      "No tripid found in asyncStore! (storeExpenseOnlineOffline)"
    );
  }
  item.expense.tripid = tripid;

  // if the internet is not fast enough, store in offline queue
  const { isFastEnough, speed } = await isConnectionFastEnough();
  console.log("isFastEnough:", isFastEnough);
  console.log("speed:", speed.toFixed(2), "Mbps");
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

// update item online if online flag is set, othwerwise store in offline queue
export const updateExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await secureStoreGetItem("currentTripId");
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Could not update Expense, please try again!",
    });
    throw new Error(
      "No tripid found in asyncStore! (storeExpenseOnlineOffline)"
    );
  }
  item.expense.tripid = tripid;
  // if the internet is not fast enough, store in offline queue
  const { isFastEnough, speed } = await isConnectionFastEnough();
  console.log("isFastEnough:", isFastEnough);
  console.log("speed:", speed.toFixed(2), "Mbps");
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

// store item online if online flag is set, otherwise store in offline queue
export const storeExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await secureStoreGetItem("currentTripId");
  if (!tripid) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Could not store Expense, please try again!",
    });
    throw new Error(
      "No tripid found in asyncStore! (storeExpenseOnlineOffline)"
    );
  }
  item.expense.tripid = tripid;
  // if the internet is not fast enough, store in offline queue
  const { isFastEnough, speed } = await isConnectionFastEnough();
  console.log("isFastEnough:", isFastEnough);
  console.log("speed:", speed.toFixed(2), "Mbps");
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

// check if we have a queue stored
export const sendOfflineQueue = async () => {
  const offlineQueue = (await secureStoreGetObject("offlineQueue")) || [];
  if (offlineQueue && offlineQueue.length > 0) {
    console.log("queue length", offlineQueue.length);
    const forceOffline = !Device.isDevice && DEBUG_FORCE_OFFLINE;
    const isOnline = await NetInfo.fetch();
    console.log("update connected =", isOnline);
    // if the internet is not fast enough, store in offline queue
    const { isFastEnough, speed } = await isConnectionFastEnough();
    console.log("isFastEnough:", isFastEnough);
    console.log("speed:", speed.toFixed(2), "Mbps");

    if (!isOnline || !isOnline.isConnected || !isFastEnough || forceOffline) {
      console.log("sendOfflineQueue ~ still offline!");
      return;
    }

    // send items in while loop
    const processedItems = [];
    let i = 0;
    let tripid = "";

    while (i < offlineQueue.length) {
      const item = offlineQueue[i];
      tripid = item.expense.tripid;

      console.log("sendOfflineQueue ~ item:", item);
      console.log("sendOfflineQueue ~ item.type:", item.type);

      try {
        if (item.type === "add") {
          const id = await storeExpense(
            item.expense.tripid,
            item.expense.uid,
            item.expense.expenseData
          );
          item.expense.id = id;
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

    if (processedItems.length > 0) {
      Toast.show({
        type: "success",
        text1: "Online again!",
        text2: `Synchronized ${processedItems.length}/${offlineQueue.length} offline Changes!`,
      });
      await touchAllTravelers(tripid, true);
    }

    // Remove the processed items from the queue
    const remainingItems = offlineQueue.slice(i);
    await secureStoreSetObject("offlineQueue", remainingItems);
  } else {
    // console.log("no queue");
  }
};
