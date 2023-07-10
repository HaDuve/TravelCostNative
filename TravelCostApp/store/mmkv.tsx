import { MMKVLoader, useMMKVStorage } from "react-native-mmkv-storage";

const MMKV = new MMKVLoader().initialize();

export const useStorage = (key: string, defaultValue?: string) => {
  const [value, setValue] = useMMKVStorage(key, MMKV, defaultValue);
  return [value, setValue];
};
