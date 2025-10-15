import { MMKV } from "react-native-mmkv";
import { Platform } from "react-native";
import * as Device from "expo-device";
import safeLogError from "../util/error";
import { safelyParseJSON } from "../util/jsonParse";
import { ExpenseData } from "../util/expense";

// Initialize MMKV with proper error handling
let mmkvstorage: MMKV | null = null;
let initializationAttempted = false;

function isJSIReady(): boolean {
  // Check if JSI is available
  return (
    typeof (global as any).__turboModuleProxy !== "undefined" ||
    typeof (global as any).HermesInternal !== "undefined" ||
    typeof (global as any).__fbBatchedBridge !== "undefined"
  );
}

function initializeMMKV(): MMKV {
  if (mmkvstorage) {
    return mmkvstorage;
  }

  if (initializationAttempted) {
    throw new Error("MMKV initialization already attempted and failed");
  }

  initializationAttempted = true;

  try {
    // Check if we're in a simulator and JSI is not ready
    if (Platform.OS === "ios" && !Device.isDevice) {
      if (!isJSIReady()) {
        safeLogError(
          "[MMKV] Running in iOS Simulator without JSI - MMKV may not work properly"
        );
      }
    }

    // Create MMKV instance with proper error handling
    mmkvstorage = new MMKV({
      id: "travel-cost-storage",
      encryptionKey: "travel-cost-encryption-key",
    });

    return mmkvstorage;
  } catch (error) {
    // Reset the flag so we can retry
    initializationAttempted = false;
    throw error;
  }
}

export function setMMKVObject(key: string, value: object) {
  try {
    const storage = initializeMMKV();
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    safeLogError(error);
  }
}

export function getMMKVObject(key: string) {
  try {
    const storage = initializeMMKV();
    const value = storage.getString(key);
    return value ? safelyParseJSON(value) : null;
  } catch (error) {
    safeLogError(error);
    return null;
  }
}

export function setMMKVString(key: string, value: string) {
  try {
    const storage = initializeMMKV();
    storage.set(key, value);
  } catch (error) {
    safeLogError(error);
  }
}

export function getMMKVString(key: string) {
  try {
    const storage = initializeMMKV();
    return storage.getString(key) ?? "";
  } catch (error) {
    safeLogError(error);
    return "";
  }
}

// Delete an MMKV object by key
export function deleteMMKVObject(key: string) {
  try {
    const storage = initializeMMKV();
    storage.delete(key);
  } catch (error) {
    safeLogError(error);
  }
}

export type IDCat = {
  expenseId: string;
  category: string;
};

// SECTION : UTILITY FUNCTIONS

// Change cat via CategoryPickScreen
export const setExpenseCat = (expenseId: string, data: IDCat) => {
  setMMKVObject(`expenseCat_${expenseId}`, data);
};

export const getExpenseCat = (expenseId: string) => {
  return getMMKVObject(`expenseCat_${expenseId}`);
};

export const clearExpenseCat = (expenseId: string) => {
  deleteMMKVObject(`expenseCat_${expenseId}`);
};

// Restore changes via draft storage
export const setExpenseDraft = (expenseId: string, data: ExpenseData) => {
  setMMKVObject(`expenseDraft_${expenseId}`, data);
};

export const getExpenseDraft = (expenseId: string) => {
  return getMMKVObject(`expenseDraft_${expenseId}`);
};

export const clearExpenseDraft = (expenseId: string) => {
  deleteMMKVObject(`expenseDraft_${expenseId}`);
};
