import React, { useEffect } from "react";
import { AppState } from "react-native";

import { useCriticalOta } from "../../store/critical-ota-context";
import { shouldShowCriticalUpdateOverlay } from "../../util/critical-update-overlay-visibility";
import CriticalUpdateOverlay from "./CriticalUpdateOverlay";

type CriticalUpdateHostProps = {
  /** Deepest focused route from NavigationContainer onStateChange / onReady. */
  focusedRouteName?: string | null;
};

/**
 * Quietly checks/fetches OTAs on cold start and foreground.
 * Shows the critical hard-block overlay only on safe routes.
 *
 * Must not call useNavigationState here — this component is mounted as a
 * sibling of navigators under NavigationContainer (see App.tsx), and
 * useNavigationState throws outside a navigator ("Couldn't get the navigation state").
 */
const CriticalUpdateHost = ({ focusedRouteName }: CriticalUpdateHostProps) => {
  const { updateReady, isCritical, requestCheckAndFetch, applyReload } =
    useCriticalOta();

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
    routeName: focusedRouteName,
  });

  return (
    <CriticalUpdateOverlay visible={visible} onReload={() => void applyReload()} />
  );
};

export default CriticalUpdateHost;
