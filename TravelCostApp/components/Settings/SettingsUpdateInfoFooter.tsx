import React, { useCallback, useContext, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { DateTime } from "luxon";

import { i18n } from "../../i18n/i18n";
import { GlobalStyles } from "../../constants/styles";
import { NetworkContext } from "../../store/network-context";
import { dynamicScale } from "../../util/scalingUtil";
import {
  EasUpdateInfo,
  getEasUpdateInfo,
} from "../../util/easUpdateInfo";

function formatPublishTime(iso: string | null) {
  if (!iso) return "—";
  return DateTime.fromISO(iso).toLocaleString(DateTime.DATETIME_MED);
}

function line(label: string, value: string | null) {
  return `${label}: ${value ?? "—"}`;
}

const SettingsUpdateInfoFooter = () => {
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected && netCtx.strongConnection;
  const [info, setInfo] = useState<EasUpdateInfo | null>(null);

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

  const runningId = info?.runningUpdateId ?? null;
  const runningCreatedAt = formatPublishTime(info?.runningUpdateCreatedAt ?? null);

  return (
    <>
      <Text style={styles.textButton}>
        {line(i18n.t("settingsUpdateIdLabel"), runningId)}
      </Text>
      <Text style={styles.textButton}>
        {line(
          i18n.t("settingsUpdateCreatedAtLabel"),
          info ? runningCreatedAt : null
        )}
      </Text>
      {info?.newerUpdateAvailable && (
        <>
          <Text style={styles.textButton}>
            {line(i18n.t("settingsNewerUpdateIdLabel"), info.newerUpdateId)}
          </Text>
          <Text style={styles.textButton}>
            {line(
              i18n.t("settingsNewerUpdateCreatedAtLabel"),
              formatPublishTime(info.newerUpdateCreatedAt)
            )}
          </Text>
        </>
      )}
    </>
  );
};

export default SettingsUpdateInfoFooter;

const styles = StyleSheet.create({
  textButton: {
    marginTop: "4%",
    paddingVertical: "1%",
    paddingHorizontal: "8%",
    textAlign: "center",
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
});
