import { MMKV } from "react-native-mmkv";

export const mmkvstorage = new MMKV();

export function setMMKVObject(key: string, value: object) {
  mmkvstorage.set(key, JSON.stringify(value));
}

export function getMMKVObject(key: string) {
  const value = mmkvstorage.getString(key);
  return value ? JSON.parse(value) : null;
}
