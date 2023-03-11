import { AppState } from "react-native";

export function getAppState() {
  return AppState.currentState;
}

export function isForeground() {
  return getAppState() === "active";
}
