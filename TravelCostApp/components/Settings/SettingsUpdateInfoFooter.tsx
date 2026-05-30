import React, { useCallback, useContext, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { i18n } from "../../i18n/i18n";
import { GlobalStyles } from "../../constants/styles";
import { NetworkContext } from "../../store/network-context";
import { dynamicScale } from "../../util/scalingUtil";
import { EasUpdateInfo, getEasUpdateInfo } from "../../util/easUpdateInfo";
import { buildVersionDisplayLines } from "../../util/settings-version-display";

const SettingsUpdateInfoFooter = () => {
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected && netCtx.strongConnection;
  const [info, setInfo] = useState<EasUpdateInfo | null>(null);
  const [expanded, setExpanded] = useState(false);

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

  const lines = buildVersionDisplayLines(info);

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={styles.headerRow}
      >
        <Text style={styles.textButton}>{i18n.t("settingsVersionHeader")}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={dynamicScale(18, false, 0.5)}
          color={GlobalStyles.colors.gray700}
        />
      </Pressable>
      {expanded && (
        <>
          {lines.updatesDisabled && (
            <Text style={styles.textButton}>
              {i18n.t("settingsUpdatesDisabledLabel")}
            </Text>
          )}
          {lines.currentLine && (
            <Text style={styles.textButton}>{lines.currentLine}</Text>
          )}
          {lines.latestLine && (
            <Text style={styles.textButton}>{lines.latestLine}</Text>
          )}
        </>
      )}
    </View>
  );
};

export default SettingsUpdateInfoFooter;

const styles = StyleSheet.create({
  headerRow: {
    marginTop: "4%",
    paddingVertical: "1%",
    paddingHorizontal: "8%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: dynamicScale(6, false, 0.5),
    marginLeft: "2%",
  },
  textButton: {
    paddingVertical: "1%",
    textAlign: "center",
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
  },
});
