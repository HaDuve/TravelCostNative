import { async } from "@firebase/util";
import * as SecureStore from "expo-secure-store";

export async function secureStoreSetItem(key, value) {
  // console.log("attempting secure save in Memory > ", key + ": " + value);
  await SecureStore.setItemAsync(key, value);
}

export async function secureStoreGetItem(key) {
  const result = await SecureStore.getItemAsync(key);
  if (result) {
    // show the result if it is not longer than 10 characters

    // console.log("🔐 Here's your value 🔐 \n" + result);
    // console.log("🔐 Here's your value 🔐 \n", result.slice(0, 10));
    return result;
  } else {
    console.log("No values stored under that key.");
  }
}

export async function secureStoreSetObject(key, value) {
  const jsonValue = JSON.stringify(value);
  await SecureStore.setItemAsync(key, jsonValue);
}

export async function secureStoreGetObject(key) {
  const result = await SecureStore.getItemAsync(key);
  if (result) {
    // parse the result and return it
    return JSON.parse(result);
  } else {
    console.log("No values stored under that key.", key);
  }
}

export async function secureStoreRemoveItem(key: string) {
  const res = await SecureStore.deleteItemAsync(key);
  return res;
}
