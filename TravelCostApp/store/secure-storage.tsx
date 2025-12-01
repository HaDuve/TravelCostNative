import * as SecureStore from "expo-secure-store";
import safeLogError from "../util/error";
import { safelyParseJSON } from "../util/jsonParse";

/**
 * Saves a key-value pair securely using SecureStore.
 * @param key - The key to save the value under.
 * @param value - The value to save.
 */
export async function secureStoreSetItem(key: string, value: string) {
  if (!key || key.trim() === "") {
    safeLogError(
      "Invalid key provided to SecureStore",
      "secure-storage.tsx",
      12
    );
    return;
  }
  if (!value) return;
  await SecureStore.setItemAsync(key, value);
}

/**
 * Retrieves the value associated with the given key from the secure store.
 * @param key - The key to retrieve the value for.
 * @returns The value associated with the given key, or an empty string if no value is found.
 */
export async function secureStoreGetItem(key: string) {
  if (!key || key.trim() === "") {
    safeLogError(
      "Invalid key provided to SecureStore",
      "secure-storage.tsx",
      25
    );
    return "";
  }
  const result = await SecureStore.getItemAsync(key);
  if (result) {
    // show the result if it is not longer than 10 characters

    return result;
  } else {
    return "";
  }
}

/**
 * Sets an object in the secure store with the specified key.
 * @param key The key to set the object with.
 * @param value The object to set in the secure store.
 */
export async function secureStoreSetObject(key: string, value: object) {
  if (!key || key.trim() === "") {
    safeLogError(
      "Invalid key provided to SecureStore",
      "secure-storage.tsx",
      45
    );
    return;
  }
  const jsonValue = JSON.stringify(value);
  if (!jsonValue) return;
  await SecureStore.setItemAsync(key, jsonValue);
}

/**
 * Retrieves a stored object from the device's secure storage.
 * @param key The key under which the object is stored.
 * @returns The retrieved object, or null if no object is stored under the given key.
 */
export async function secureStoreGetObject(key: string) {
  if (!key || key.trim() === "") {
    safeLogError(
      "Invalid key provided to SecureStore",
      "secure-storage.tsx",
      60
    );
    return null;
  }
  const result = await SecureStore.getItemAsync(key);
  try {
    return result ? safelyParseJSON(result) : null;
  } catch (error) {
    safeLogError(error);
    return null;
  }
}

/**
 * Removes an item from the secure store.
 * @param key - The key of the item to remove.
 * @returns A Promise that resolves to true if the item was successfully removed, or false otherwise.
 */
export async function secureStoreRemoveItem(key: string) {
  if (!key || key.trim() === "") {
    safeLogError(
      "Invalid key provided to SecureStore",
      "secure-storage.tsx",
      80
    );
    return false;
  }
  const res = await SecureStore.deleteItemAsync(key);
  return res;
}
