/* eslint-disable react/prop-types */
import { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ProfileForm from "../components/ManageProfile/ProfileForm";
import TripList from "../components/ProfileOutput/TripList";
import MyBudgetsHubActions from "../components/ProfileOutput/MyBudgetsHubActions";
import FeedbackForm from "../components/FeedbackForm/FeedbackForm";
import { GlobalStyles } from "../constants/styles";
import { shadowRegressionStyles } from "../styles/shadow-regression-styles";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";

import { i18n } from "../i18n/i18n";
import React from "react";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { AuthContext } from "../store/auth-context";
import { secureStoreGetItem } from "../store/secure-storage";
import { storeExpoPushTokenInTrip } from "../util/http";

import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { ExpoPushToken } from "expo-notifications";
// Branch.io removed
import Purchases from "react-native-purchases";
import { setAttributesAsync } from "../components/Premium/PremiumConstants";
import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "../store/mmkv";
import { NetworkContext } from "../store/network-context";
import { dynamicScale } from "../util/scalingUtil";
import GetLocalPriceButton from "../components/Settings/GetLocalPriceButton";
import GradientButton from "../components/UI/GradientButton";
import safeLogError from "../util/error";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";
import IconButton from "../components/UI/IconButton";

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
      if (getMMKVObject(MMKV_KEYS.EXPO_PUSH_ASK)?.never) return;
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
      setMMKVObject(MMKV_KEYS.EXPO_PUSH_TOKEN_STATUS, { failed: true });
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
    setMMKVObject(MMKV_KEYS.EXPO_PUSH_TOKEN_STATUS, { failed: true });
  }
}

const ProfileScreen = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const uid = authCtx.uid;
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected && netCtx.strongConnection;

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
    const status = getMMKVObject(MMKV_KEYS.EXPO_PUSH_TOKEN_STATUS);
    if (status?.failed) {
      setMMKVObject(MMKV_KEYS.EXPO_PUSH_TOKEN_STATUS, null);
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

  const visibleContent = (
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
      <View style={styles.tripContainer} testID="profile-trip-container">
        <Text style={styles.tripListTitle}>{i18n.t("myBudgets")}</Text>
        <MyBudgetsHubActions
          onJoin={() => navigation.navigate("Join")}
          onAddAnother={() =>
            navigation.navigate("ManageTrip", { mode: "addAnother" })
          }
        />
        <Text style={styles.listSectionLabel}>{i18n.t("yourBudgets")}</Text>
        <TripList trips={tripHistory}></TripList>
      </View>
      <View style={styles.horizontalButtonContainer}>
        <View>
          <IconButton
            icon="list-outline"
            buttonStyle={[styles.addButton, shadowRegressionStyles.addExpenseFab]}
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
    margin: dynamicScale(16),
    marginBottom: dynamicScale(8, true),
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
    marginBottom: dynamicScale(12, true),
  },
  listSectionLabel: {
    fontSize: dynamicScale(13, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.gray700,
    marginTop: dynamicScale(8, true),
    marginBottom: dynamicScale(8, true),
    marginLeft: dynamicScale(4),
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
