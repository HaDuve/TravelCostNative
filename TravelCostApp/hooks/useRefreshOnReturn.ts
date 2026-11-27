import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

/**
 * A counter that goes up whenever the user comes back to the screen: when it
 * regains focus or when the app returns to the foreground. Use it as a memo
 * dependency to refresh time-relative labels ("Just now") without a ticking
 * timer.
 */
export function useRefreshOnReturn(): number {
  const [returns, setReturns] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const refresh = () => setReturns((count) => count + 1);
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") refresh();
      },
    );
    // not every host of the list is a navigator screen
    const unsubscribeFocus =
      typeof navigation?.addListener === "function"
        ? navigation.addListener("focus", refresh)
        : undefined;
    return () => {
      appStateSubscription?.remove();
      unsubscribeFocus?.();
    };
  }, [navigation]);

  return returns;
}
