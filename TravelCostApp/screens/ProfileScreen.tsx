/* eslint-disable react/prop-types */
import { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import ProfileForm from "../components/ManageProfile/ProfileForm";
import TripList from "../components/ProfileOutput/TripList";
import IconButton from "../components/UI/IconButton";
import { GlobalStyles } from "../constants/styles";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import React from "react";
import { BranchEvent } from "react-native-branch";
import { TourGuideZone, useTourGuideController } from "rn-tourguide";
import { useInterval } from "../components/Hooks/useInterval";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
import { AuthContext } from "../store/auth-context";
import { secureStoreGetItem } from "../store/secure-storage";
import { sleep } from "../util/appState";
import { storeExpoPushTokenInTrip } from "../util/http";
import { saveStoppedTour } from "../util/tourUtil";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = ((Localization.getLocales()[0]&&Localization.getLocales()[0].languageCode)?Localization.getLocales()[0].languageCode.slice(0,2):'en');
i18n.enableFallback = true;
// i18n.locale = "de";

import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { ExpoPushToken } from "expo-notifications";
import branch from "react-native-branch";
import Purchases from "react-native-purchases";
import { setAttributesAsync } from "../components/Premium/PremiumConstants";
import { getMMKVObject, setMMKVObject } from "../store/mmkv";
import { NetworkContext } from "../store/network-context";
import { constantScale, dynamicScale } from "../util/scalingUtil";

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
      // console.log("Failed to get push token for push notification!");
      Alert.alert(
        "Notifications",
        "Please enable notifications in settings!",
        // neveraskagain button
        [
          {
            text: "Never ask again",
            onPress: () => {
              // console.log("Never ask again");
              setMMKVObject("expoPushAsk", { never: true });
            },
          },
          {
            text: "OK",
            onPress: () => {
              // console.log("OK");
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
      // console.log("storeExpoPushTokenInTrip succeeded");
    } catch {
      // console.log("storeExpoPushTokenInTrip failed, will try later");
      setMMKVObject("expoPushTokenStatus", { failed: true });
    }
    // console.log(token);
  } else {
    // console.log("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: GlobalStyles.colors.primary100,
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
        // console.log("token", token);
        setExpoPushToken(token);
      })
      .catch((e) => Alert.alert(e, e.message));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // console.log(response);
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
        // console.log(
        //   "setAttributesAsync - Settings - ForRevCat ~ error:",
        //   error
        // );
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
      if (!userCtx.tripHistory || userCtx.tripHistory?.length < 1) {
        await userCtx.updateTripHistory();
      }
    }
    fetchHistory();
  }, [userCtx]);

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
    // console.log("sleepyStartTour ~ sleepyStartTour:", sleepyStartTour);
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
    // console.log("start");
  };
  const handleOnStop = () => {
    saveStoppedTour();
    userCtx.setNeedsTour(false);
    setTourIsRunning(false);
    const event = new BranchEvent(BranchEvent.CompleteTutorial);
    event.logEvent();
    // console.log("stop");
  };
  const handleOnStepChange = async (step) => {
    // console.log(`stepChange, name: ${step?.name} order: ${step?.order}`);
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
      <ScrollView style={styles.tripContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.tripListTitle}>{i18n.t("myTrips")}</Text>
          {/* <Pressable onPress={navigation.navigate.bind(this, "ManageTrip")}> */}
          {/* <Text style={{ color: GlobalStyles.colors.primary700 }}>+</Text> */}
          <TourGuideZone
            text={i18n.t("walk5")}
            shape={"circle"}
            maskOffset={constantScale(24, 0.5)}
            zone={5}
          >
            <IconButton
              icon={"ios-earth"}
              size={dynamicScale(36, false, 0.5)}
              buttonStyle={styles.newTripButtonContainer}
              color={GlobalStyles.colors.primary400}
              onPress={navigation.navigate.bind(this, "ManageTrip")}
            />
          </TourGuideZone>
          {/* </Pressable> */}
        </View>
        <TourGuideZone
          text={i18n.t("walk6")}
          maskOffset={constantScale(200, 0.1)}
          tooltipBottomOffset={constantScale(150, 0.1)}
          zone={6}
        >
          <TripList trips={tripHistory}></TripList>
        </TourGuideZone>
      </ScrollView>
      <View style={styles.horizontalButtonContainer}>
        <TourGuideZone
          text={i18n.t("walk7")}
          maskOffset={constantScale(50, 0.5)}
          tooltipBottomOffset={constantScale(50, 0.5)}
          zone={7}
        >
          <View>
            {/* FAB */}
            <IconButton
              // icon="md-document-attach-outline"
              icon="list-outline"
              buttonStyle={[styles.addButton, GlobalStyles.shadowGlowPrimary]}
              size={dynamicScale(42, false, 0.5)}
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
    flex: 0,
    minHeight: dynamicScale(100, true),
    padding: dynamicScale(4),
  },

  tripContainer: {
    flex: 1,
    // minHeight: "68%",
    margin: dynamicScale(16),
    marginBottom: dynamicScale(-150, true),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  horizontalContainer: {
    marginTop: dynamicScale(15, false, 0.3),
    marginRight: dynamicScale(15),
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
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: dynamicScale(10),
  },
  deleteContainer: {
    marginTop: dynamicScale(16, true),
    paddingTop: dynamicScale(8, true),
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    padding: dynamicScale(16, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    marginBottom: dynamicScale(4, true),
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
    fontSize: dynamicScale(14, false, 0.5),
    paddingVertical: "2%",
    paddingHorizontal: "2%",
    color: GlobalStyles.colors.gray700,
    fontWeight: "300",
  },
});
