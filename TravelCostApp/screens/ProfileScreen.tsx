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
import FeedbackForm from "../components/FeedbackForm/FeedbackForm";
import { GlobalStyles } from "../constants/styles";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";

import { i18n } from "../i18n/i18n";
import React from "react";
import { TourGuideZone, useTourGuideController } from "rn-tourguide";
import { useInterval } from "../components/Hooks/useInterval";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { AuthContext } from "../store/auth-context";
import { secureStoreGetItem } from "../store/secure-storage";
import { sleep } from "../util/appState";
import { storeExpoPushTokenInTrip } from "../util/http";
import { saveStoppedTour } from "../util/tourUtil";

import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { ExpoPushToken } from "expo-notifications";
// Branch.io removed
import Purchases from "react-native-purchases";
import { setAttributesAsync } from "../components/Premium/PremiumConstants";
import { getMMKVObject, setMMKVObject } from "../store/mmkv";
import { NetworkContext } from "../store/network-context";
import { constantScale, dynamicScale } from "../util/scalingUtil";
import GetLocalPriceButton from "../components/Settings/GetLocalPriceButton";
import GradientButton from "../components/UI/GradientButton";
import safeLogError from "../util/error";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
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
      // Notification permissions not granted - silently return without showing alert
      return;
    }
    // todo implement a later get if device is offline

    try {
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      });
      // granted so we want to save the token in the trip
      await storeExpoPushTokenInTrip(token, "");
    } catch {
      setMMKVObject("expoPushTokenStatus", { failed: true });
    }
  } else {
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
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);

  // possible future use of notification display
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] =
    useState<Notifications.Notification>(null);
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((pushToken: ExpoPushToken) => {
        if (!pushToken) return;
        const token = pushToken.data;
        setExpoPushToken(token);
      })
      .catch((e) => Alert.alert(e, e.message));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
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
        // Branch.io removed - no campaign tracking
      } catch (error) {
        //   "setAttributesAsync - Settings - ForRevCat ~ error:",
        //   error
        // );
      }
    }
    setAttributesAsync();
  }, [emailString, userCtx.userName, isConnected]);

  function onSummaryHandler() {
    trackEvent(VexoEvents.VIEW_TRIP_SUMMARY_PRESSED);
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
    trackEvent(VexoEvents.ONBOARDING_TOUR_STARTED);
    navigation.navigate("RecentExpenses");
  };
  const handleOnStop = () => {
    trackEvent(VexoEvents.ONBOARDING_TOUR_SKIPPED);
    saveStoppedTour();
    userCtx.setNeedsTour(false);
    setTourIsRunning(false);
    // Branch.io removed - no event logging
  };
  const handleOnStepChange = async (step) => {
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
      <View style={styles.headerButtonsContainer}>
        <GetLocalPriceButton
          navigation={navigation}
          style={styles.headerButton}
        />
        <GradientButton
          style={styles.headerButton}
          buttonStyle={{}}
          onPress={() => {
            trackEvent(VexoEvents.FEEDBACK_BUTTON_PRESSED);
            setIsFeedbackModalVisible(true);
          }}
        >
          {i18n.t("supportFeedbackLabel")}
        </GradientButton>
      </View>
      <ScrollView style={styles.tripContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.tripListTitle}>{i18n.t("myTrips")}</Text>
          <TourGuideZone
            text={i18n.t("walk5")}
            shape={"circle"}
            maskOffset={constantScale(24, 0.5)}
            zone={5}
          >
            <IconButton
              icon={"globe-outline"}
              size={dynamicScale(36, false, 0.5)}
              buttonStyle={styles.newTripButtonContainer}
              color={GlobalStyles.colors.primary400}
              badge={null}
              badgeText={null}
              badgeStyle={null}
              onPressIn={null}
              onPressOut={null}
              onLongPress={null}
              category={null}
              onPress={() => {
                trackEvent(VexoEvents.CREATE_TRIP_FROM_PROFILE_PRESSED);
                navigation.navigate("ManageTrip");
              }}
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
            <IconButton
              icon="list-outline"
              buttonStyle={[styles.addButton, GlobalStyles.shadowGlowPrimary]}
              size={dynamicScale(42, false, 0.5)}
              color={GlobalStyles.colors.backgroundColor}
              badge={null}
              badgeText={null}
              badgeStyle={null}
              onPressIn={null}
              onPressOut={null}
              onLongPress={null}
              category={null}
              onPress={() => {
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

      <FeedbackForm
        isVisible={isFeedbackModalVisible}
        onClose={() => setIsFeedbackModalVisible(false)}
      />
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
  headerButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: dynamicScale(16, false, 0.5),
    paddingVertical: dynamicScale(8, true),
    marginBottom: dynamicScale(8, true),
  },
  headerButton: {
    flex: 1,
    marginHorizontal: dynamicScale(4, false, 0.5),
    borderRadius: 16,
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
