import { useFocusEffect } from "@react-navigation/native";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { DateTime } from "luxon";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { DEBUG_POLLING_INTERVAL } from "../../confAppConstants";
import { GlobalStyles } from "../../constants/styles";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { AuthContext } from "../../store/auth-context";
import { getOfflineQueue } from "../../util/offline-queue";
import { versionCheck, VersionCheckResponse } from "../../util/version";
import { useInterval } from "../Hooks/useInterval";

//Localization

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { NetworkContext } from "../../store/network-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import { storeExpoPushTokenInTrip } from "../../util/http";
import BackButton from "../UI/BackButton";
import Button from "../UI/Button";

import { ExpoPushToken } from "expo-notifications";

import { OnboardingFlags } from "../../types/onboarding";
import safeLogError from "../../util/error";
import { showBanner } from "../UI/ToastComponent";

const DevContent = ({ navigation }) => {
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const userCtx = useContext(UserContext);
  const isConnected = netCtx.isConnected && netCtx.strongConnection;
  const [latestVersion, setLatestVersion] = useState("");
  const [currentVersion, setCurrentVersion] = useState("");
  const [timeZoneString, setTimeZoneString] = useState("");
  const [DEBUG_tripid, setDEBUG_tripid] = useState("");
  const [DEBUG_uid, setDEBUG_uid] = useState("");
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useInterval(
    () => {
      async function asyncGetOfflineQueue() {
        const queue = await getOfflineQueue();
        setOfflineQueue(queue ?? []);
      }
      asyncGetOfflineQueue();
    },
    DEBUG_POLLING_INTERVAL,
    true
  );

  useEffect(() => {
    setDEBUG_tripid(tripCtx.tripid);
    setDEBUG_uid(authCtx.uid);
  }, [tripCtx.tripid, authCtx.uid]);

  useEffect(() => {
    async function checkVersion() {
      if (isConnected) {
        const data: VersionCheckResponse = await versionCheck();
        // console.log("checkVersion ~ versionCheckResponse:", data);
        const latestVersion = data?.latestVersion;
        const currentVersion = data?.currentVersion;
        if (!latestVersion || !currentVersion) return;
        setLatestVersion(latestVersion);
        setCurrentVersion(currentVersion);
      }
    }
    checkVersion();
  }, [isConnected]);

  // Show detailed timezone info
  useFocusEffect(
    React.useCallback(() => {
      // checking timezone in DEV MODE
      const timeZone = `${DateTime.now().setLocale(i18n.locale).toLocaleString({
        weekday: "short",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })} ${DateTime.now().zoneName} ${DateTime.now().toFormat("ZZZZ")}`;
      setTimeZoneString(timeZone);
    }, [])
  );

  return (
    <View>
      <View style={styles.titleContainer}>
        <BackButton style={{}} />
        <Text style={styles.titleText}>DEVCONTENT</Text>
      </View>

      <Button
        style={styles.settingsButton}
        onPress={async () => {
          navigation.navigate("RecentExpenses");
          const onboardingFlags: OnboardingFlags = {
            freshlyCreated: userCtx.freshlyCreated,
            needsTour: userCtx.needsTour,
          };
          await showBanner(navigation, onboardingFlags);
        }}
      >
        showAdBanner
      </Button>

      <View style={{ padding: 12, flex: 1 }}>
        {currentVersion && <Text>Current Version: {currentVersion}</Text>}
        {latestVersion && <Text>Latest Version: {latestVersion}</Text>}
      </View>
      <Text>DEBUG_tripid: {DEBUG_tripid}</Text>
      <Text>DEBUG_uid: {DEBUG_uid}</Text>
      <Text>{timeZoneString}</Text>
      {/* render offline queue */}
      {/* offqitem - > expense -> expenseData */}
      <Text>
        {i18n.t("devOfflineQueue")}
        {(!offlineQueue || offlineQueue.length < 1) && " empty"}
      </Text>
      <FlatList
        data={offlineQueue}
        renderItem={item => {
          if (!item.item.expense) return null;
          const index = item.index;
          return (
            <View style={{ flexDirection: "row" }}>
              <Text>
                {index + 1} {item.item.type}{" "}
              </Text>
              <Text>{item.item.expense?.expenseData?.description}</Text>
            </View>
          );
        }}
      ></FlatList>
      <Text>{errorMessage}</Text>
      {!isFetching && (
        <Button
          style={styles.settingsButton}
          onPress={async () => {
            setIsFetching(true);
            // testing the expo token routine
            try {
              const token: ExpoPushToken = {
                data: "ExponentPushToken[3s-g4nEpxTm6ATLeXpKESm]",
                type: "expo",
              };
              // await Notifications.getExpoPushTokenAsync({
              //   projectId: Constants.expoConfig.extra.eas.projectId,
              // });
              // granted so we want to save the token in the trip
              await storeExpoPushTokenInTrip(token, "");
              // console.log("storeExpoPushTokenInTrip succeeded");
            } catch (error) {
              const message = safeLogError(error);
              setErrorMessage(message);
            }
            setIsFetching(false);
          }}
        >
          Expo Token
        </Button>
      )}

      <Button
        style={styles.settingsButton}
        // onPress={async () => await trackPurchaseEvent()}
        onPress={async () => {}}
      >
        trackPurchaseEvent
      </Button>
      <Button
        onPress={async () => {
          await tripCtx.fetchAndSettleCurrentTrip(true);
          navigation.pop();
        }}
        style={styles.settingsButton}
      >
        UnsettleAllSplits
      </Button>
    </View>
  );
};

export default DevContent;

const styles = StyleSheet.create({
  backButton: { marginBottom: "-14%" },
  settingsButton: {
    borderRadius: 16,
    marginHorizontal: "8%",
    marginVertical: "2%",
  },
  textButton: {
    borderRadius: 16,
    color: GlobalStyles.colors.gray700,
    fontSize: 16,
    fontStyle: "italic",
    fontWeight: "bold",
    marginLeft: "2%",
    marginTop: "8%",
    paddingHorizontal: "8%",
    paddingVertical: "2%",
    textAlign: "center",
  },
  titleContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: "30%",
    paddingVertical: "3%",
  },
  titleText: {
    color: GlobalStyles.colors.gray700,
    fontSize: 22,
    fontStyle: "italic",
    fontWeight: "bold",
    marginLeft: "2%",
  },
});
