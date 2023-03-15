import { AppState } from "react-native";

export function getAppState() {
  return AppState.currentState;
}

export function isForeground() {
  return getAppState() === "active";
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
