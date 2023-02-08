import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetObject,
} from "../store/async-storage";
import { Expense } from "./expense";
import { storeExpense } from "./http";

// interface of offline queue manage expense item
export interface OfflineQueueManageExpenseItem {
  timeStamp?: string;
  type: "add" | "update" | "delete";
  expense: Expense;
}

// retrieve offlinequeue and push new item
export const pushOfflineQueue = async (item: OfflineQueueManageExpenseItem) => {
  console.log("pushOfflineQueue ~ item", item);
  const offlineQueue = await getOfflineQueue();
  offlineQueue.push(item);
  const res = await asyncStoreSetObject("offlineQueue", offlineQueue);
  console.log("pushOfflineQueue ~ offlineQueue", offlineQueue);
  return res;
};

// retrieve offlinequeue
export const getOfflineQueue = async () => {
  const offlineQueue = await asyncStoreGetObject("offlineQueue");
  return offlineQueue || [];
};

// store item online if online flag is set, otherwise store in offline queue
export const storeExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await asyncStoreGetItem("currentTripId");
  console.log("storeExpenseOnlineOffline ~ async tripid", tripid);
  item.expense.tripid = tripid;
  console.log("storeExpenseOnlineOffline ~ online", online);
  if (online) {
    // store item online
    const id = await storeExpense(
      item.expense.tripid,
      item.expense.uid,
      item.expense.expenseData
    );
    return id;
  } else {
    // store item offline
    const res = await pushOfflineQueue(item);
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
};

// check if we have a queue stored
export const sendOfflineQueue = async () => {
  const queue = await asyncStoreGetObject("offlineQueue");
  if (queue && queue.length > 0) {
    console.log("queue length", queue.length);
    // for each OfflineQueueManageExpenseItem in queue activate
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      console.log("item", item);
      if (item.type === "add") {
        const id = await storeExpense(
          item.expense.tripid,
          item.expense.uid,
          item.expense.expenseData
        );
        console.log("id", id);
      } else if (item.type === "update") {
        // await updateExpenseOnlineOffline(item, true);
      } else if (item.type === "delete") {
        // await deleteExpenseOnlineOffline(item, true);
      } else {
        console.log("unknown type");
      }
    }
    // clear queue
    await asyncStoreSetObject("offlineQueue", []);
  } else {
    console.log("no queue");
  }
};
