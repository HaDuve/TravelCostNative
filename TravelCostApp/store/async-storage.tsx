import AsyncStorage from "@react-native-async-storage/async-storage";

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
  console.log("attempting save in Memory > ", key + ": " + value);
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
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Async Clear, but safer:
 *
 * first calls getAllKeys() and then multiremove(keys)
 */
export async function asyncStoreSafeClear() {
  console.log("attempting to clear all async stored Memory > ");
  let keys: readonly string[];
  try {
    keys = await AsyncStorage.getAllKeys();
  } catch (error) {
    // read key error
    console.error(error);
  }
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    // remove error
    console.error(error);
  }
}
