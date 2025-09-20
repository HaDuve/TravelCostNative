import { StyleSheet } from "react-native";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { Text, View, Button, Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { ExpoPushToken } from "expo-notifications";
import { storeExpoPushTokenInTrip } from "../util/http";
import { Toast } from "react-native-toast-message/lib/src/Toast";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

// Can use this function below or use Expo's Push Notification Tool from: https://expo.dev/notifications
async function sendPushNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Original Title",
    body: "And here is the body!",
    data: { someData: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      // alert("Failed to get push token for push notification!");
      Toast.show({
        type: "error",
        text1: "Failed to get permissions for push notification!",
        visibilityTime: 1000,
        autoHide: true,
      });
      return;
    }
    // todo implement a later get if device is offline
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    // granted so we want to save the token in the trip
    await storeExpoPushTokenInTrip(token, "");
    // console.log(token);
  } else {
    // alert("Must use physical device for Push Notifications");
    Toast.show({
      type: "error",
      text1: i18n.t("mustUsePhysicalDevice"),
      visibilityTime: 1000,
      autoHide: true,
    });
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

const TEST_PushScreen = () => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] =
    useState<Notifications.Notification>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((pushToken: ExpoPushToken) => {
        const token = pushToken.data;
        // console.log("token", token);
        setExpoPushToken(token);
      })
      .catch((e) => {
        // console.log("token error", e)
      });

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

  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "space-around" }}
    >
      <Text>{i18n.t("yourExpoPushToken")} {expoPushToken}</Text>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text>
          Title: {notification && notification.request.content.title}{" "}
        </Text>
        <Text>{i18n.t("bodyLabel")} {notification && notification.request.content.body}</Text>
        <Text>
          Data:{" "}
          {notification && JSON.stringify(notification.request.content.data)}
        </Text>
      </View>
      <Button
        title={i18n.t("pressToSendNotification")}
        onPress={async () => {
          await sendPushNotification(expoPushToken);
        }}
      />
    </View>
  );
};

export default TEST_PushScreen;

const styles = StyleSheet.create({});
