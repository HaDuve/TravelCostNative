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
  const res = await asyncStoreSetObject("offlineQueue", offlineQueue);
  console.log("pushOfflineQueue ~ offlineQueue:", offlineQueue);
  return res;
};

// retrieve offlinequeue
export const getOfflineQueue = async () => {
  const offlineQueue = await asyncStoreGetObject("offlineQueue");
  return offlineQueue || [];
};

// delete item online if online flag is set, otherwise store in offline queue
export const deleteExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await asyncStoreGetItem("currentTripId");
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
  if (online) {
    // delete item online
    try {
      await deleteExpense(
        item.expense.tripid,
        item.expense.uid,
        item.expense.id
      );
      // Toast.show({
      //   type: "success",
      //   text1: "Deleted!",
      //   text2: "Successfully deleted the Expense!",
      // });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not delete Expense, please try again!",
      });
    }
  } else {
    // delete item offline
    try {
      await pushOfflineQueue(item);
      // Toast.show({
      //   type: "success",
      //   text1: "Deleted!",
      //   text2: "Successfully deleted Expense!",
      // });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not delete Expense, please try again!",
      });
    }
  }
};

// update item online if online flag is set, othwerwise store in offline queue
export const updateExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await asyncStoreGetItem("currentTripId");
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
  if (online) {
    // update item online
    try {
      await updateExpense(
        item.expense.tripid,
        item.expense.uid,
        item.expense.id,
        item.expense.expenseData
      );
      // Toast.show({
      //   type: "success",
      //   text1: "Updated!",
      //   text2: "Successfully updated the Expense!",
      // });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not update Expense, please try again!",
      });
    }
  } else {
    // update item offline
    try {
      await pushOfflineQueue(item);
      // Toast.show({
      //   type: "success",
      //   text1: "Updated!",
      //   text2: "Successfully updated the Expense!",
      // });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not update Expense, please try again!",
      });
    }
  }
};

// store item online if online flag is set, otherwise store in offline queue
export const storeExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await asyncStoreGetItem("currentTripId");
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
  if (online) {
    // store item online
    try {
      const id = await storeExpense(
        item.expense.tripid,
        item.expense.uid,
        item.expense.expenseData
      );
      // Toast.show({
      //   type: "success",
      //   text1: "Stored!",
      //   text2: "Successfully stored the Expense!",
      // });
      return id;
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not store Expense, please try again!",
      });
    }
  } else {
    // store item offline
    try {
      await pushOfflineQueue(item);
      // Toast.show({
      //   type: "success",
      //   text1: "Stored!",
      //   text2: "Successfully stored the Expense!",
      // });
      return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not store Expense, please try again!",
      });
    }
  }
};

// check if we have a queue stored
export const sendOfflineQueue = async () => {
  const queue = await asyncStoreGetObject("offlineQueue");
  if (queue && queue.length > 0) {
    console.log("queue length", queue.length);
    const forceOffline = !Device.isDevice && DEBUG_FORCE_OFFLINE;
    const isOnline = await NetInfo.fetch();
    console.log("update connected =", isOnline);
    if (!isOnline || !isOnline.isConnected || forceOffline) {
      console.log("sendOfflineQueue ~ still offline!");
      return;
    }
    // for each OfflineQueueManageExpenseItem in queue activate
    let tripid = "";
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      tripid = item.expense.tripid;
      try {
        await touchAllTravelers(tripid, true);
        console.log("sendOfflineQueue ~ item:", item);
        console.log("sendOfflineQueue ~ item.type:", item.type);
        if (item.type === "add") {
          await storeExpense(
            item.expense.tripid,
            item.expense.uid,
            item.expense.expenseData
          );
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
          console.log("unknown type");
        }
      } catch (error) {
        Toast.show({
          text1: "Error syncing data",
          text2: "I will try to sync again later!",
          type: "error",
        });
        return;
      }
    }

    // clear queue
    await asyncStoreSetObject("offlineQueue", []);

    Toast.show({
      type: "success",
      text1: "Online again!",
      text2: "Synchronizing " + queue.length + " offline Changes!",
    });
  } else {
    // console.log("no queue");
  }
};
