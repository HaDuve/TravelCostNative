import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { secureStoreRemoveItem } from "./secure-storage";
import { ACTIVE_TRIP_ID_KEY } from "../util/active-trip-id";
import safeLogError from "../util/error";
import { safelyParseJSON } from "../util/jsonParse";
import { deleteMMKVObject, MMKV_KEYS } from "./mmkv";

/**
 * Store item in long-term Memory of the device.
 * Limited Space (8MB) for Android.
 * @param key The name of the item to be stored
 * @param value The value of the item to be stored
 */
export async function asyncStoreSetItem(
  key: string,
  value: string | number | boolean
) {
  if (!value) {
    await AsyncStorage.removeItem(key);
    return;
  }
  if (typeof value !== "string") {
    value = value.toString();
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Store object in long-term Memory of the device.
 * Limited Space (8MB) for Android.
 * @param key The name of the object to be stored
 * @param value The value of the object to be stored
 */
export async function asyncStoreSetObject(key: string, value: unknown) {
  if (!value) {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Read item from long-term Memory of the device.
 * @param key The name of the item to be stored
 */
export async function asyncStoreGetItem(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Read item from long-term Memory of the device.
 * @param key The name of the item to be stored
 */
export async function asyncStoreGetObject(key: string) {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? safelyParseJSON(jsonValue) : null;
  } catch (error) {
    safeLogError(error);
  }
}

/**
 * Async Clear, but safer:
 *
 * first calls getAllKeys() and then multiremove(keys)
 */
export async function asyncStoreSafeClear() {
  // add keys(prefixes) which should never be deleted
  const neverDelete = ["@userEmail", "firstStart"];

  let keys: readonly string[];
  try {
    keys = await AsyncStorage.getAllKeys();
  } catch (error) {
    safeLogError(error);
  }
  // remove all keys except the keys which have a neverDelete prefix
  keys = keys.filter((key) => {
    for (let i = 0; i < neverDelete?.length; i++) {
      if (key.startsWith(neverDelete[i])) {
        return false;
      }
    }
    return true;
  });

  try {
    await AsyncStorage.multiRemove(keys);
    await secureStoreRemoveItem("token");
    await secureStoreRemoveItem("uid");
    await secureStoreRemoveItem(ACTIVE_TRIP_ID_KEY);
    await secureStoreRemoveItem("freshlyCreated");
    await secureStoreRemoveItem("lastCountry");
    await secureStoreRemoveItem("lastCurrency");
    await secureStoreRemoveItem("ENCM");
    await secureStoreRemoveItem("ENCP");
    // MMKV survives AsyncStorage/secure clears; drop Active trip + expenses so
    // the next login cannot resurrect the prior session's cache.
    deleteMMKVObject(MMKV_KEYS.CURRENT_TRIP);
    deleteMMKVObject(MMKV_KEYS.EXPENSES);
  } catch (error) {
    safeLogError(error);
  }
}
