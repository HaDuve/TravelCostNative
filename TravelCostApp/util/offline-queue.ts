import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetObject,
} from "../store/async-storage";
import { Expense } from "./expense";
import { storeExpense, updateExpense, deleteExpense } from "./http";

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
  item.expense.tripid = tripid;
  if (online) {
    // delete item online
    const res = await deleteExpense(
      item.expense.tripid,
      item.expense.uid,
      item.expense.id
    );
  } else {
    // delete item offline
    const res = await pushOfflineQueue(item);
  }
};

// update item online if online flag is set, othwerwise store in offline queue
export const updateExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await asyncStoreGetItem("currentTripId");
  item.expense.tripid = tripid;
  if (online) {
    // update item online
    const res = await updateExpense(
      item.expense.tripid,
      item.expense.uid,
      item.expense.id,
      item.expense.expenseData
    );
  } else {
    // update item offline
    const res = await pushOfflineQueue(item);
  }
};

// store item online if online flag is set, otherwise store in offline queue
export const storeExpenseOnlineOffline = async (
  item: OfflineQueueManageExpenseItem,
  online: boolean
) => {
  // load tripid from asyncstore to fix the tripctx tripid bug
  const tripid = await asyncStoreGetItem("currentTripId");
  item.expense.tripid = tripid;
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
      if (item.type === "add") {
        const id = await storeExpense(
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
    }
    // clear queue
    await asyncStoreSetObject("offlineQueue", []);
  } else {
    console.log("no queue");
  }
};
