import { MMKV } from "react-native-mmkv";
import { Platform } from "react-native";
import * as Device from "expo-device";
import safeLogError from "../util/error";
import { safelyParseJSON } from "../util/jsonParse";
import { MMKVKey } from "./mmkv-keys";

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

export function setMMKVObject(key: MMKVKey, value: object) {
  try {
    const storage = initializeMMKV();
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    safeLogError(error);
  }
}

export function getMMKVObject(key: MMKVKey) {
  try {
    const storage = initializeMMKV();
    const value = storage.getString(key);
    return value ? safelyParseJSON(value) : null;
  } catch (error) {
    safeLogError(error);
    return null;
  }
}

export function setMMKVString(key: MMKVKey, value: string) {
  try {
    const storage = initializeMMKV();
    storage.set(key, value);
  } catch (error) {
    safeLogError(error);
  }
}

export function getMMKVString(key: MMKVKey) {
  try {
    const storage = initializeMMKV();
    return storage.getString(key) ?? "";
  } catch (error) {
    safeLogError(error);
    return "";
  }
}

// Delete an MMKV object by key
export function deleteMMKVObject(key: MMKVKey) {
  try {
    const storage = initializeMMKV();
    storage.delete(key);
  } catch (error) {
    safeLogError(error);
  }
}

// Re-export helper functions for backward compatibility
export {
  setExpenseCat,
  getExpenseCat,
  clearExpenseCat,
  setExpenseDraft,
  getExpenseDraft,
  clearExpenseDraft,
  getRecentCurrencies,
  addRecentCurrency,
  initializeRecentCurrencies,
  type IDCat,
} from "./mmkv-helpers";

// Re-export keys for convenience
export { MMKV_KEYS, MMKV_KEY_PATTERNS } from "./mmkv-keys";
