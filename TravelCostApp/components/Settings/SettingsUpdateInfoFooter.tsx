import React, { useCallback, useContext, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { i18n } from "../../i18n/i18n";
import { GlobalStyles } from "../../constants/styles";
import { NetworkContext } from "../../store/network-context";
import { useCriticalOta } from "../../store/critical-ota-context";
import { dynamicScale } from "../../util/scalingUtil";
import { EasUpdateInfo, getEasUpdateInfo } from "../../util/easUpdateInfo";
import { buildVersionDisplayLines } from "../../util/settings-version-display";
import ActionRow from "../UI/ActionRow";

const SettingsUpdateInfoFooter = () => {
  const netCtx = useContext(NetworkContext);
  const {
    updateReady,
    isCritical,
    requestCheckAndFetch,
    applyReload,
  } = useCriticalOta();
  const isConnected = netCtx.isConnected && netCtx.strongConnection;
  const [info, setInfo] = useState<EasUpdateInfo | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);

  const refresh = useCallback(async () => {
    setInfo(
      await getEasUpdateInfo({
        checkForNewer: Boolean(isConnected),
      })
    );
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const applyNewerUpdate = useCallback(async () => {
    if (applying) return;
    setApplying(true);
    try {
      if (updateReady && !isCritical) {
        await applyReload();
        return;
      }

      const result = await requestCheckAndFetch();
      if (result.updateReady && !result.isCritical) {
        await applyReload();
      }
      // Critical: App-level overlay hard-blocks; Settings is a safe route.
    } catch {
      Toast.show({
        type: "error",
        text1: i18n.t("settingsApplyUpdateError"),
      });
    } finally {
      setApplying(false);
    }
  }, [
    applying,
    updateReady,
    isCritical,
    applyReload,
    requestCheckAndFetch,
  ]);

  const lines = buildVersionDisplayLines(info);
  const versionHeaderLabel = i18n.t("settingsVersionHeader");
  const showApplyCta = Boolean(lines.latestLine) || updateReady;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={versionHeaderLabel}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((prev) => !prev)}
        style={styles.headerRow}
      >
        <Text style={styles.headerText}>{versionHeaderLabel}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={dynamicScale(18, false, 0.5)}
          color={GlobalStyles.colors.gray700}
        />
      </Pressable>
      {expanded && (
        <>
          {lines.updatesDisabled && (
            <Text style={styles.bodyText}>
              {i18n.t("settingsUpdatesDisabledLabel")}
            </Text>
          )}
          {lines.currentLine && (
            <Text style={styles.bodyText}>{lines.currentLine}</Text>
          )}
          {lines.latestLine && (
            <Text style={styles.bodyText}>{lines.latestLine}</Text>
          )}
          {showApplyCta && (
            <ActionRow
              tier="primary"
              label={i18n.t("settingsApplyUpdate")}
              icon="refresh-outline"
              showChevron={false}
              disabled={applying}
              onPress={applyNewerUpdate}
              style={styles.applyRow}
            />
          )}
        </>
      )}
    </View>
  );
};

export default SettingsUpdateInfoFooter;

const styles = StyleSheet.create({
  section: {
    marginTop: "4%",
  },
  headerRow: {
    paddingVertical: "1%",
    paddingHorizontal: "8%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: dynamicScale(6, false, 0.5),
    marginLeft: "2%",
  },
  headerText: {
    textAlign: "center",
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
  },
  bodyText: {
    paddingVertical: "1%",
    paddingHorizontal: "8%",
    marginLeft: "2%",
    textAlign: "center",
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
  },
  applyRow: {
    marginTop: dynamicScale(12, true, 0.5),
    marginHorizontal: "8%",
  },
});
