import { MMKV } from "react-native-mmkv";
import safeLogError from "../util/error";

export const mmkvstorage = new MMKV();

export function setMMKVObject(key: string, value: object) {
  mmkvstorage.set(key, JSON.stringify(value));
}

export function getMMKVObject(key: string) {
  const value = mmkvstorage.getString(key);
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    safeLogError(error);
    return null;
  }
}

export function setMMKVString(key: string, value: string) {
  mmkvstorage.set(key, value);
}
export function getMMKVString(key: string) {
  return mmkvstorage.getString(key) ?? "";
}
