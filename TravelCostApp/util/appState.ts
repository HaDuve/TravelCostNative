import * as Updates from "expo-updates";
import { AppState } from "react-native";

export function getAppState() {
  return AppState.currentState;
}

export function isForeground() {
  return getAppState() === "active";
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function reloadApp() {
  try {
    await Updates.reloadAsync();
  } catch (error) {
    // console.log("Updates.reloadAsync error, returning -1");
    return -1;
  }
}
