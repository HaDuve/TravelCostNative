import React, { useCallback, useContext, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { i18n } from "../../i18n/i18n";
import { GlobalStyles } from "../../constants/styles";
import { NetworkContext } from "../../store/network-context";
import { useCriticalOta } from "../../store/critical-ota-context";
import { dynamicScale } from "../../util/scalingUtil";
import { EasUpdateInfo, getEasUpdateInfo } from "../../util/easUpdateInfo";
import { buildVersionDisplayLines } from "../../util/settings-version-display";
import { checkAndFetchOtaUpdate } from "../../util/check-and-fetch-ota-update";
import { createExpoOtaApplyClient } from "../../util/ota-apply-client";
import ActionRow from "../UI/ActionRow";

const SettingsUpdateInfoFooter = () => {
  const netCtx = useContext(NetworkContext);
  const { noteUpdateReady } = useCriticalOta();
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
      const client = createExpoOtaApplyClient();
      const result = await checkAndFetchOtaUpdate(client);
      noteUpdateReady(result);
      if (result.updateReady && !result.isCritical) {
        await client.reload();
      }
      // Critical: App-level overlay hard-blocks; Settings is a safe route.
    } finally {
      setApplying(false);
    }
  }, [applying, noteUpdateReady]);

  const lines = buildVersionDisplayLines(info);
  const versionHeaderLabel = i18n.t("settingsVersionHeader");
  const showApplyCta = Boolean(lines.latestLine);

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
