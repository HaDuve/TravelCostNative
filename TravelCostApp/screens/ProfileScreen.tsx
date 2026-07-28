/* eslint-disable react/prop-types */
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import uniqBy from "lodash.uniqby";
import ProfileIdentity from "../components/ManageProfile/ProfileIdentity";
import ProfileToolbar from "../components/ManageProfile/ProfileToolbar";
import TripListRow from "../components/ProfileOutput/TripListRow";
import MyBudgetsHubActions from "../components/ProfileOutput/MyBudgetsHubActions";
import FeedbackForm from "../components/FeedbackForm/FeedbackForm";
import { GlobalStyles } from "../constants/styles";
import { shadowRegressionStyles } from "../styles/shadow-regression-styles";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";

import { i18n } from "../i18n/i18n";
import React from "react";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import LoadingOverlay from "../components/UI/LoadingOverlay";
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
import { dynamicScale, constantScale } from "../util/scalingUtil";
import GetLocalPriceButton from "../components/Settings/GetLocalPriceButton";
import GradientButton from "../components/UI/GradientButton";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";
import IconButton from "../components/UI/IconButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTripListLeave } from "../components/ProfileOutput/use-trip-list-leave";

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

const TOOLBAR_CONTENT_HEIGHT = dynamicScale(52, true);

const ProfileScreen = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const uid = authCtx.uid;
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected && netCtx.strongConnection;
  const insets = useSafeAreaInsets();

  const [tripHistory, setTripHistory] = useState([]);
  const [isFetchingLogout, setIsFetchingLogout] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);

  const scrollTopInset =
    Math.max(insets.top, dynamicScale(8, true)) + TOOLBAR_CONTENT_HEIGHT;

  const { canLeave, closeRow, onLeavePress, setRowRef } =
    useTripListLeave(tripHistory);

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

  const renderListHeader = useCallback(
    () => (
      <View testID="profile-scroll-header">
        <ProfileIdentity navigation={navigation} />
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
        <View style={styles.tripHubSection}>
          <Text style={styles.tripListTitle}>{i18n.t("myBudgets")}</Text>
          <MyBudgetsHubActions
            onJoin={() => navigation.navigate("Join")}
            onAddAnother={() =>
              navigation.navigate("ManageTrip", { mode: "addAnother" })
            }
          />
          <Text style={styles.listSectionLabel}>{i18n.t("yourBudgets")}</Text>
        </View>
      </View>
    ),
    [navigation]
  );

  const renderTripItem = useCallback(
    ({ item, index }) => {
      if (!item) return null;
      if (!(typeof item === "string" || item instanceof String)) return null;
      const tripid = item as string;
      return (
        <TripListRow
          tripid={tripid}
          trips={tripHistory}
          index={index}
          canLeave={canLeave}
          onLeavePress={onLeavePress}
          onSwipeableOpen={closeRow}
          setRowRef={setRowRef}
        />
      );
    },
    [tripHistory, canLeave, onLeavePress, closeRow, setRowRef]
  );

  const uniqTrips = uniqBy(tripHistory ?? []);

  if (isFetchingLogout)
    return (
      <LoadingBarOverlay customText="Logging you out..."></LoadingBarOverlay>
    );

  return (
    <View style={styles.container}>
      <ProfileToolbar
        navigation={navigation}
        setIsFetchingLogout={setIsFetchingLogout}
      />
      <FlatList
        testID="profile-scroll"
        data={uniqTrips}
        keyExtractor={(item) => {
          if (typeof item === "string" || item instanceof String)
            return item as string;
          return item.tripid + item.tripName;
        }}
        renderItem={renderTripItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={<LoadingOverlay />}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: scrollTopInset },
        ]}
        ListFooterComponent={
          <View style={{ height: constantScale(100), width: "100%" }} />
        }
      />
      <View style={styles.fabContainer} pointerEvents="box-none">
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
          onPress={onSummaryHandler}
        />
      </View>

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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: dynamicScale(16, false, 0.5),
    paddingBottom: dynamicScale(8, true),
  },
  headerButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: dynamicScale(8, true),
    marginBottom: dynamicScale(8, true),
  },
  headerButton: {
    flex: 1,
    marginHorizontal: dynamicScale(4, false, 0.5),
    borderRadius: 16,
  },
  tripHubSection: {
    marginBottom: dynamicScale(8, true),
    backgroundColor: GlobalStyles.colors.backgroundColor,
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
  fabContainer: {
    position: "absolute",
    bottom: dynamicScale(16, true),
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    padding: dynamicScale(16, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    borderRadius: 99,
  },
});
