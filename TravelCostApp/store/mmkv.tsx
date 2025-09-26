import { MMKV } from "react-native-mmkv";
import { Platform } from "react-native";
import * as Device from "expo-device";
import safeLogError from "../util/error";
import { safelyParseJSON } from "../util/jsonParse";

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
        console.warn(
          "[MMKV] Running in iOS Simulator without JSI - MMKV may not work properly"
        );
        // Still attempt initialization as some simulators might work
      }
    }

    // Create MMKV instance with proper error handling
    mmkvstorage = new MMKV({
      id: "travel-cost-storage",
      encryptionKey: "travel-cost-encryption-key",
    });

    console.log("[MMKV] Successfully initialized");
    return mmkvstorage;
  } catch (error) {
    console.error("[MMKV] Failed to initialize:", error);
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
    console.error("[MMKV] Failed to set object:", error);
    safeLogError(error);
  }
}

export function getMMKVObject(key: string) {
  try {
    const storage = initializeMMKV();
    const value = storage.getString(key);
    return value ? safelyParseJSON(value) : null;
  } catch (error) {
    console.error("[MMKV] Failed to get object:", error);
    safeLogError(error);
    return null;
  }
}

export function setMMKVString(key: string, value: string) {
  try {
    const storage = initializeMMKV();
    storage.set(key, value);
  } catch (error) {
    console.error("[MMKV] Failed to set string:", error);
    safeLogError(error);
  }
}

export function getMMKVString(key: string) {
  try {
    const storage = initializeMMKV();
    return storage.getString(key) ?? "";
  } catch (error) {
    console.error("[MMKV] Failed to get string:", error);
    safeLogError(error);
    return "";
  }
}
