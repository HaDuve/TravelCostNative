import React, { useEffect } from "react";
import { AppState } from "react-native";
import { useNavigationState } from "@react-navigation/native";

import { useCriticalOta } from "../../store/critical-ota-context";
import { shouldShowCriticalUpdateOverlay } from "../../util/critical-update-overlay-visibility";
import { getFocusedRouteName } from "../../util/focused-route-name";
import CriticalUpdateOverlay from "./CriticalUpdateOverlay";

/**
 * Quietly checks/fetches OTAs on cold start and foreground.
 * Shows the critical hard-block overlay only on safe routes.
 */
const CriticalUpdateHost = () => {
  const { updateReady, isCritical, requestCheckAndFetch, applyReload } =
    useCriticalOta();

  const routeName = useNavigationState((state) =>
    getFocusedRouteName(state as never)
  );

  useEffect(() => {
    void requestCheckAndFetch();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void requestCheckAndFetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [requestCheckAndFetch]);

  const visible = shouldShowCriticalUpdateOverlay({
    updateReady,
    isCritical,
    routeName,
  });

  return (
    <CriticalUpdateOverlay visible={visible} onReload={() => void applyReload()} />
  );
};

export default CriticalUpdateHost;
