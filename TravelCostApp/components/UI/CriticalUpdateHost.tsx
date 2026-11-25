import React, { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import { useCriticalOta } from "../../store/critical-ota-context";
import { shouldAutoApplyCriticalUpdate } from "../../util/critical-update-auto-apply";

type CriticalUpdateHostProps = {
  /** Deepest focused route from NavigationContainer onStateChange / onReady. */
  focusedRouteName?: string | null;
};

/**
 * Quietly checks/fetches OTAs on cold start and foreground. A fetched critical
 * OTA reloads the app automatically, deferred while an expense form is open.
 * Shows a short "Updating…" toast while reloading; no confirmation.
 *
 * Must not call useNavigationState here — this component is mounted as a
 * sibling of navigators under NavigationContainer (see App.tsx), and
 * useNavigationState throws outside a navigator ("Couldn't get the navigation state").
 */
const CriticalUpdateHost = ({ focusedRouteName }: CriticalUpdateHostProps) => {
  const { updateReady, isCritical, requestCheckAndFetch, applyReload } =
    useCriticalOta();
  const reloadStartedRef = useRef(false);
  const [applying, setApplying] = useState(false);

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

  const shouldApply = shouldAutoApplyCriticalUpdate({
    updateReady,
    isCritical,
    routeName: focusedRouteName,
  });

  useEffect(() => {
    if (!shouldApply || reloadStartedRef.current) return;
    // One attempt per session: a failing reload must not loop.
    reloadStartedRef.current = true;
    setApplying(true);
    applyReload().catch(() => setApplying(false));
  }, [shouldApply, applyReload]);

  if (!applying) return null;
  return (
    <View style={styles.toast} pointerEvents="none" testID="critical-update-toast">
      <Text style={styles.text}>{i18n.t("criticalUpdateApplying")}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: GlobalStyles.colors.primary500,
  },
  text: { color: "white", fontWeight: "600" },
});

export default CriticalUpdateHost;
