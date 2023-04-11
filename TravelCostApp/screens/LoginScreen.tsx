import AuthContent from "../components/Auth/AuthContent";
import React, { useContext, useState } from "react";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { login } from "../util/auth";
import { Alert, Platform } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { AuthContext } from "../store/auth-context";
import { UserContext } from "../store/user-context";
import { fetchUser, touchMyTraveler } from "../util/http";
import { TripContext } from "../store/trip-context";
import { asyncStoreSetItem, asyncStoreSetObject } from "../store/async-storage";
import Toast from "react-native-toast-message";
import { KeyboardAvoidingView } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import Purchases from "react-native-purchases";
import { API_KEY } from "../components/Premium/PremiumConstants";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);
    // Check internet connection first
    if (!(await userCtx.checkConnectionUpdateUser())) {
      Toast.show({
        type: "error",
        text1: i18n.t("noConnection"),
        text2: i18n.t("checkConnectionError"),
      });
      setIsAuthenticating(false);
      return;
    }
    try {
      const { token, uid } = await login(email, password);
      //// START OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
      const checkUser = await fetchUser(uid);
      console.log("loginHandler ~ checkUser", checkUser);
      // Check if the user logged in but there is no userName, we deleted the account
      if (!checkUser || !checkUser.userName) {
        Toast.show({
          type: "error",
          position: "top",
          text1: i18n.t("exceptionError"),
          text2: i18n.t("tryAgain"),
          visibilityTime: 4000,
        });
        authCtx.logout();
      }
      if (checkUser.userName && !checkUser.currentTrip) {
        // we infer freshly created if no current trip exists but we assigned a name already
        console.log(
          "loginHandler ~ we set to freshly because username but no current trip!"
        );
        userCtx.setFreshlyCreatedTo(true);
      }
      //// END OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
      // setup purchases
      if (Platform.OS === "android") {
        // Purchases
        Purchases.configure({
          apiKey: "<public_google_sdk_key>",
          appUserID: uid,
        });
      } else if (Platform.OS === "ios") {
        // Purchases
        Purchases.configure({ apiKey: API_KEY, appUserID: uid });
        console.log("LoginScreen ~ uid:", uid);
      }
      try {
        const userData = checkUser;
        console.log("loginHandler ~ userData", userData);
        const tripid = userData.currentTrip;
        await asyncStoreSetItem("currentTripId", tripid);
        await touchMyTraveler(tripid, uid);
        tripCtx.setTripid(tripid);
        userCtx.addUser(userData);
        await tripCtx.fetchAndSetCurrentTrip(tripid);
        await userCtx.loadCatListFromAsyncInCtx(tripid);
        tripCtx.refresh();
      } catch (error) {
        Alert.alert(i18n.t("noConnection"), i18n.t("tryAgain"));
      }
      authCtx.setUserID(uid);
      authCtx.authenticate(token);
    } catch (error) {
      console.error(error);
      setIsAuthenticating(false);
      Alert.alert(i18n.t("authError"), i18n.t("authErrorText"));
      authCtx.logout();
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message={i18n.t("loginLoadText")} />;
  }

  return (
    <KeyboardAvoidingView behavior={"position"}>
      <AuthContent isLogin onAuthenticate={loginHandler} />
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;
