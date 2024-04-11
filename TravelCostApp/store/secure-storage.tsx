import * as SecureStore from "expo-secure-store";
import safeLogError from "../util/error";

/**
 * Saves a key-value pair securely using SecureStore.
 * @param key - The key to save the value under.
 * @param value - The value to save.
 */
export async function secureStoreSetItem(key: string, value: string) {
  // console.log("attempting secure save in Memory > ", key + ": " + value);
  if (!value) return;
  await SecureStore.setItemAsync(key, value);
}

/**
 * Retrieves the value associated with the given key from the secure store.
 * @param key - The key to retrieve the value for.
 * @returns The value associated with the given key, or an empty string if no value is found.
 */
export async function secureStoreGetItem(key: string) {
  const result = await SecureStore.getItemAsync(key);
  if (result) {
    // show the result if it is not longer than 10 characters

    // // console.log("🔐 Here's your value 🔐 \n" + result);
    // // console.log("🔐 Here's your value 🔐 \n", result.slice(0, 10));
    return result;
  } else {
    // console.log("No values stored under that key.", key);
    return "";
  }
}

/**
 * Sets an object in the secure store with the specified key.
 * @param key The key to set the object with.
 * @param value The object to set in the secure store.
 */
export async function secureStoreSetObject(key: string, value: object) {
  const jsonValue = JSON.stringify(value);
  // console.log("secureStoreSetObject ~ key, jsonValue:", key, jsonValue);
  if (!jsonValue) return;
  await SecureStore.setItemAsync(key, jsonValue);
}

/**
 * Retrieves a stored object from the device's secure storage.
 * @param key The key under which the object is stored.
 * @returns The retrieved object, or null if no object is stored under the given key.
 */
export async function secureStoreGetObject(key: string) {
  const result = await SecureStore.getItemAsync(key);
  try {
    return result ? JSON.parse(result) : null;
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
  const res = await SecureStore.deleteItemAsync(key);
  return res;
}
