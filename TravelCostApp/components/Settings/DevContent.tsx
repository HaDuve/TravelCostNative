import { StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { useInterval } from "../Hooks/useInterval";
import { getOfflineQueue } from "../../util/offline-queue";
import { DEBUG_POLLING_INTERVAL, DEVELOPER_MODE } from "../../confAppConstants";
import { versionCheck, VersionCheckResponse } from "../../util/version";
import { useFocusEffect } from "@react-navigation/native";
import { DateTime } from "luxon";
import { FlatList } from "react-native-gesture-handler";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Button from "../UI/Button";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { importExcelFile } from "../ImportExport/OpenXLSXPicker";
import { AuthContext } from "../../store/auth-context";
import { UserContext } from "../../store/user-context";
import { TripContext } from "../../store/trip-context";
import { NetworkContext } from "../../store/network-context";
import { GlobalStyles } from "../../constants/styles";
import { exportAllExpensesToXLSX } from "../ImportExport/ExportToGoogleXlsx";
import { ExpensesContext } from "../../store/expenses-context";
import {
  initBranch,
  showBranchParams,
  trackPurchaseEvent,
} from "../Referral/branch";
import { storeExpoPushTokenInTrip } from "../../util/http";
import { ExpoPushToken } from "expo-notifications";
import safeLogError from "../../util/error";

const DevContent = ({ navigation }) => {
  console.log("DevContent rendered");
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const expensesCtx = useContext(ExpensesContext);
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
        console.log("getOfflineQueue ~ queue:", queue?.length);
        queue.forEach((Item) => {
          console.log(Item.type, Item.expense.expenseData?.description);
        });
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
        console.log("checkVersion ~ versionCheckResponse:", data);
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
      const timeZone =
        DateTime.now().setLocale(i18n.locale).toLocaleString({
          weekday: "short",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " " +
        DateTime.now().zoneName +
        " " +
        DateTime.now().toFormat("ZZZZ");
      setTimeZoneString(timeZone);
    }, [])
  );

  const developerOutput = DEVELOPER_MODE && (
    <View>
      {/* spacer View */}

      <View style={{ flex: 1, minHeight: 100 }}></View>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>DEVCONTENT</Text>
      </View>
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
        {"Offline Queue"}
        {(!offlineQueue || offlineQueue.length < 1) && " empty"}
      </Text>
      <FlatList
        data={offlineQueue}
        renderItem={(item) => {
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
              console.log("storeExpoPushTokenInTrip succeeded");
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
        onPress={async () => await initBranch()}
      >
        initBranch
      </Button>

      <Button
        style={styles.settingsButton}
        onPress={async () => await showBranchParams()}
      >
        showBranchParams
      </Button>

      <Button
        style={styles.settingsButton}
        onPress={async () => await trackPurchaseEvent()}
      >
        trackPurchaseEvent
      </Button>

      <LoadingBarOverlay
        progress={0.3}
        progressAt={3}
        progressMax={10}
      ></LoadingBarOverlay>

      <Button
        onPress={importExcelFile.bind(
          this,
          authCtx.uid,
          tripCtx.tripid,
          userCtx.userName,
          expensesCtx.addExpense
        )}
        style={styles.settingsButton}
      >
        {/* aus der Excel .xlsm */}
        Import GehMalReisen
      </Button>
      <Button
        onPress={navigation.navigate.bind(this, "ImportGS", {
          uid: authCtx.uid,
          tripid: tripCtx.tripid,
          userName: userCtx.userName,
          addExpense: expensesCtx.addExpense,
        })}
        style={styles.settingsButton}
      >
        {/* aus der heruntergeladenen GoogleSheets als Xlsx */}
        Import FoodForNomads
      </Button>
      <Button
        onPress={exportAllExpensesToXLSX.bind(this, expensesCtx.expenses)}
        style={styles.settingsButton}
      >
        {/* in die heruntergeladene GoogleSheets als Xlsx */}
        {/* danach muss zurueck konvertiert werden  */}
        Export FoodForNomads
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

  return developerOutput;
};

export default DevContent;

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: "30%",
    paddingVertical: "3%",
  },
  backButton: { marginBottom: "-14%" },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  settingsButton: {
    marginVertical: "2%",
    marginHorizontal: "8%",
    borderRadius: 16,
  },
  textButton: {
    marginTop: "8%",
    paddingVertical: "2%",
    paddingHorizontal: "8%",
    borderRadius: 16,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
});
