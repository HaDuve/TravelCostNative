import * as SecureStore from "expo-secure-store";

export async function secureStoreSetItem(key, value) {
  console.log("attempting secure save in Memory > ", key + ": " + value);
  await SecureStore.setItemAsync(key, value);
}

export async function secureStoreGetItem(key) {
  const result = await SecureStore.getItemAsync(key);
  if (result) {
    console.log("🔐 Here's your value 🔐 \n" + result);
    return result;
  } else {
    console.log("No values stored under that key.");
  }
}

export async function secureStoreRemoveItem(key) {
  const res = await SecureStore.deleteItemAsync(key);
  return res;
}
