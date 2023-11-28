/* eslint-disable react/prop-types */
import { StyleSheet, Text, View, Platform, Alert } from "react-native";
import { GlobalStyles } from "../constants/styles";
import ProfileForm from "../components/ManageProfile/ProfileForm";
import TripList from "../components/ProfileOutput/TripList";
import { useContext, useState, useEffect, useRef } from "react";
import IconButton from "../components/UI/IconButton";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import React from "react";
import { saveStoppedTour } from "../util/tourUtil";
import { TourGuideZone, useTourGuideController } from "rn-tourguide";
import { sleep } from "../util/appState";
import { useInterval } from "../components/Hooks/useInterval";
import { secureStoreGetItem } from "../store/secure-storage";
import { fetchTripHistory, storeExpoPushTokenInTrip } from "../util/http";
import { AuthContext } from "../store/auth-context";
import { BranchEvent } from "react-native-branch";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "de";

import { ExpoPushToken } from "expo-notifications";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { getMMKVObject, setMMKVObject } from "../store/mmkv";
import { NetworkContext } from "../store/network-context";
import { useFocusEffect } from "@react-navigation/native";
import { setAttributesAsync } from "../components/Premium/PremiumConstants";
import Purchases from "react-native-purchases";
import branch from "react-native-branch";
import safeLogError from "../util/error";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token: ExpoPushToken;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      if (getMMKVObject("expoPushAsk")?.never) return;
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      // alert("Failed to get push token for push notification!");
      console.log("Failed to get push token for push notification!");
      Alert.alert(
        "Notifications",
        "Please enable notifications in settings!",
        // neveraskagain button
        [
          {
            text: "Never ask again",
            onPress: () => {
              console.log("Never ask again");
              setMMKVObject("expoPushAsk", { never: true });
            },
          },
          {
            text: "OK",
            onPress: () => {
              console.log("OK");
            },
          },
        ],
        { cancelable: false }
      );
      return;
    }
    // todo implement a later get if device is offline

    try {
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      });
      // granted so we want to save the token in the trip
      await storeExpoPushTokenInTrip(token, "");
      console.log("storeExpoPushTokenInTrip succeeded");
    } catch {
      console.log("storeExpoPushTokenInTrip failed, will try later");
      setMMKVObject("expoPushTokenStatus", { failed: true });
    }
    console.log(token);
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

async function storeToken() {
  try {
    const token: ExpoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    await storeExpoPushTokenInTrip(token, "");
  } catch (error) {
    console.log("storeExpoPushTokenInTrip failed, will try later");
    setMMKVObject("expoPushTokenStatus", { failed: true });
  }
}

const ProfileScreen = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const uid = authCtx.uid;
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected && netCtx.strongConnection;

  const [tourIsRunning, setTourIsRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [isFetchingLogout, setIsFetchingLogout] = useState(false);

  // possible future use of notification display
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] =
    useState<Notifications.Notification>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((pushToken: ExpoPushToken) => {
        if (!pushToken) return;
        const token = pushToken.data;
        console.log("token", token);
        setExpoPushToken(token);
      })
      .catch((e) => console.log("token error", e));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    const status = getMMKVObject("expoPushTokenStatus");
    if (status?.failed) {
      setMMKVObject("expoPushTokenStatus", null);
      storeToken();
    }
  }, [isConnected]);

  const [emailString, setEmailString] = useState("");
  async function getEmail() {
    const email = await secureStoreGetItem("ENCM");
    if (email) {
      setEmailString(email);
    }
  }

  useEffect(() => {
    userCtx.loadUserNameFromStorage();
  }, []);
  useFocusEffect(() => {
    userCtx.loadUserNameFromStorage();
  });
  useFocusEffect(() => {
    getEmail();
  });
  useFocusEffect(() => {
    setAttributesAsync(emailString, userCtx.userName);
  });
  useEffect(() => {
    setAttributesAsync(emailString, userCtx.userName);
  }, [emailString, userCtx.userName]);
  useEffect(() => {
    getEmail();
  }, []);
  useEffect(() => {
    async function setAttributesAsync() {
      try {
        if (emailString) await Purchases.setAttributes({ email: emailString });
        if (userCtx.userName)
          await Purchases.setAttributes({ name: userCtx.userName });
        if (!isConnected) return;
        const params = await branch.getLatestReferringParams();
        if (params) {
          if (params["~channel"])
            await Purchases.setAttributes({ channel: params["~channel"] });
        }
      } catch (error) {
        console.log(
          "setAttributesAsync - Settings - ForRevCat ~ error:",
          error
        );
      }
    }
    setAttributesAsync();
  }, [emailString, userCtx.userName, isConnected]);

  function onSummaryHandler() {
    navigation.navigate("TripSummary");
  }

  useEffect(() => {
    setTripHistory(userCtx.tripHistory);
    async function fetchHistory() {
      console.log("fetchHistory ~ fetchHistory:", fetchHistory);
      if (!userCtx.tripHistory || userCtx.tripHistory?.length < 1) {
        const uid = await secureStoreGetItem("uid");
        console.log("fetch ~ uid:", uid);
        if (!uid) return;
        try {
          // TODO: if failed fetch later
          const tripHistoryResponse = await fetchTripHistory(uid);
          console.log("fetch ~ tripHistoryResponse:", tripHistoryResponse);
          userCtx.setTripHistory(tripHistoryResponse);
        } catch (error) {
          safeLogError(error);
        }
      }
    }
    // console.log("useEffect ~ userCtx.tripHistory:", userCtx.tripHistory);
    fetchHistory();
  }, [userCtx.tripHistory?.length, uid, tripCtx.tripid]);

  useInterval(
    () => {
      if (canStart && userCtx.needsTour && !tourIsRunning) {
        // 👈 test if you can start otherwise nothing will happen
        sleepyStartTour();
      }
    },
    3000,
    false
  );

  const {
    canStart, // a boolean indicate if you can start tour guide
    start, // a function to start the tourguide
    // stop, // a function  to stopping it
    eventEmitter, // an object for listening some events
  } = useTourGuideController();
  // Can start at mount 🎉
  // you need to wait until everything is registered 😁
  async function sleepyStartTour() {
    console.log("sleepyStartTour ~ sleepyStartTour:", sleepyStartTour);
    setTourIsRunning(true);
    await sleep(1000);
    start();
  }
  useEffect(() => {
    if (canStart && userCtx.needsTour) {
      // 👈 test if you can start otherwise nothing will happen
      sleepyStartTour();
    }
  }, [canStart, userCtx.needsTour]); // 👈 don't miss it!

  const handleOnStart = () => {
    navigation.navigate("RecentExpenses");
    console.log("start");
  };
  const handleOnStop = () => {
    saveStoppedTour();
    userCtx.setNeedsTour(false);
    setTourIsRunning(false);
    const event = new BranchEvent(BranchEvent.CompleteTutorial);
    event.logEvent();
    console.log("stop");
  };
  const handleOnStepChange = async (step) => {
    console.log(`stepChange, name: ${step?.name} order: ${step?.order}`);
    switch (step?.order) {
      case 1:
        await navigation.navigate("RecentExpenses");
        break;
      case 2:
        await navigation.navigate("RecentExpenses");
        break;
      case 3:
        await navigation.navigate("RecentExpenses");
        break;
      case 4:
        await navigation.navigate("Overview");
        break;
      case 5:
        await navigation.navigate("Profile");
        break;
      case 6:
        await navigation.navigate("Profile");
        break;
      case 7:
        await navigation.navigate("Profile");
        break;
      case 8:
      default:
        navigation.navigate("RecentExpenses");
        break;
    }
  };

  React.useEffect(() => {
    eventEmitter.on("start", handleOnStart);
    eventEmitter.on("stop", handleOnStop);
    eventEmitter.on("stepChange", handleOnStepChange);

    return () => {
      eventEmitter.off("start", handleOnStart);
      eventEmitter.off("stop", handleOnStop);
      eventEmitter.off("stepChange", handleOnStepChange);
    };
  }, []);

  const visibleContent = userCtx.freshlyCreated ? (
    <></>
  ) : (
    <>
      <View style={styles.tripContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.tripListTitle}>{i18n.t("myTrips")}</Text>
          {/* <Pressable onPress={navigation.navigate.bind(this, "ManageTrip")}> */}
          {/* <Text style={{ color: GlobalStyles.colors.primary700 }}>+</Text> */}
          <TourGuideZone
            text={i18n.t("walk5")}
            shape={"circle"}
            maskOffset={24}
            zone={5}
          >
            <IconButton
              icon={"ios-earth"}
              size={36}
              buttonStyle={styles.newTripButtonContainer}
              color={GlobalStyles.colors.primary400}
              onPress={navigation.navigate.bind(this, "ManageTrip")}
            />
          </TourGuideZone>
          {/* </Pressable> */}
        </View>
        <TourGuideZone
          text={i18n.t("walk6")}
          maskOffset={200}
          tooltipBottomOffset={250}
          zone={6}
        >
          <TripList
            trips={tripHistory}
            // setRefreshing={setRefreshing}
            // refreshControl={
            //   <RefreshControl
            //     refreshing={refreshing}
            //     // onRefresh={refreshHandler}
            //   />
            // }
          ></TripList>
        </TourGuideZone>
      </View>
      <View style={styles.horizontalButtonContainer}>
        <TourGuideZone
          text={i18n.t("walk7")}
          maskOffset={50}
          tooltipBottomOffset={50}
          zone={7}
        >
          <View>
            {/* FAB */}
            <IconButton
              // icon="md-document-attach-outline"
              icon="list-outline"
              buttonStyle={[styles.addButton, GlobalStyles.shadowGlowPrimary]}
              size={42}
              color={GlobalStyles.colors.backgroundColor}
              onPress={() => {
                // onShare(tripCtx.tripid, navigation);
                onSummaryHandler();
              }}
            />
          </View>
        </TourGuideZone>
      </View>
    </>
  );

  if (isFetchingLogout)
    return (
      <LoadingBarOverlay customText="Logging you out..."></LoadingBarOverlay>
    );

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <ProfileForm
          navigation={navigation}
          setIsFetchingLogout={setIsFetchingLogout}
        ></ProfileForm>
      </View>
      {visibleContent}
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  innerContainer: {
    flex: 2,
    padding: 4,
  },

  tripContainer: {
    flex: 1,
    minHeight: "68%",
    margin: 16,
    marginBottom: -30,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  horizontalContainer: {
    marginTop: "3%",
    marginRight: "3%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  horizontalButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // make it appear behind the triplist
    // zIndex: -1,
  },

  newTripButtonContainer: {
    flexDirection: "row",
    padding: "10%",
    paddingHorizontal: "12%",
    marginBottom: "2%",
    marginTop: "-4%",
    marginRight: "-12%",
    borderRadius: 99,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 8,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 2.5, height: 2.2 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    //center
    alignSelf: "center",
  },
  tripListTitle: {
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    padding: 16,
    paddingHorizontal: 18,
    marginBottom: 4,
    borderRadius: 99,
  },
  offlineWarningContainer: {
    // center content
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
  },
  offlineWarningText: {
    fontSize: 14,
    paddingVertical: "2%",
    paddingHorizontal: "2%",
    color: GlobalStyles.colors.gray700,
    fontWeight: "300",
  },
});
