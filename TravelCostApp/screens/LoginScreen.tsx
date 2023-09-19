import AuthContent from "../components/Auth/AuthContent";
import React, { useContext, useEffect, useState } from "react";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { login } from "../util/auth";
import { Platform } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { AuthContext } from "../store/auth-context";
import { UserContext } from "../store/user-context";
import { fetchUser, touchMyTraveler } from "../util/http";
import { TripContext } from "../store/trip-context";
import Toast from "react-native-toast-message";
import Purchases from "react-native-purchases";
import {
  loadKeys,
  Keys,
  setAttributesAsync,
} from "../components/Premium/PremiumConstants";
import { NetworkContext } from "../store/network-context";
import { secureStoreSetItem } from "../store/secure-storage";
import { ExpensesContext } from "../store/expenses-context";
import { setMMKVObject } from "../store/mmkv";
import { BranchEvent } from "react-native-branch";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const expCtx = useContext(ExpensesContext);
  const [isConnected, setIsConnected] = useState(
    netCtx.isConnected && netCtx.strongConnection
  );
  useEffect(() => {
    setIsConnected(netCtx.isConnected && netCtx.strongConnection);
  }, [netCtx.isConnected, netCtx.strongConnection]);

  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);
    if (!isConnected) {
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
      console.log("loginHandler ~ uid:", uid);
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
        console.log("loginHandler exectption error");
        authCtx.logout();
      }
      let freshlyCreated = checkUser.freshlyCreated || userCtx.freshlyCreated;
      if (checkUser.userName && !checkUser.currentTrip) {
        // we infer freshly created if no current trip exists but we assigned a name already
        console.log(
          "loginHandler ~ we set to freshly because username but no current trip!"
        );
        await userCtx.setFreshlyCreatedTo(true);
        freshlyCreated = true;
      }
      //// END OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
      const { REVCAT_G, REVCAT_A }: Keys = await loadKeys();

      // setup purchases
      if (Platform.OS === "android") {
        // Purchases
        Purchases.configure({
          apiKey: REVCAT_G,
          appUserID: uid,
        });
      } else if (Platform.OS === "ios" || Platform.OS === "macos") {
        // Purchases
        Purchases.configure({ apiKey: REVCAT_A, appUserID: uid });
        await userCtx.checkPremium();
        console.log("LoginScreen ~ uid:", uid);
      }
      const userData = checkUser;
      await setAttributesAsync(email, userData.userName);
      await userCtx.addUserName(userData);
      await authCtx.setUserID(uid);
      console.log("loginHandler ~ userData", userData);
      const tripid = userData.currentTrip;
      if (!tripid && freshlyCreated) {
        await authCtx.authenticate(token);
      }
      await secureStoreSetItem("currentTripId", tripid);
      await secureStoreSetItem("uid", uid);
      await touchMyTraveler(tripid, uid);
      tripCtx.setTripid(tripid);
      await tripCtx.fetchAndSetCurrentTrip(tripid);
      await userCtx.loadCatListFromAsyncInCtx(tripid);
      await userCtx.updateTripHistory();
      tripCtx.refresh();
      expCtx.setExpenses([]);
      setMMKVObject("expenses", []);
      const event = new BranchEvent(BranchEvent.Login);
      await event.logEvent();
      await authCtx.authenticate(token);
    } catch (error) {
      console.error(error);
      setIsAuthenticating(false);
      // Alert.alert(i18n.t("authError"), i18n.t("authErrorText"));
      // // Alert.alert(i18n.t("authError"), error.message);
      // authCtx.logout();
    }
    console.log("end reached?");
  }

  if (isAuthenticating) {
    return <LoadingOverlay customText={i18n.t("loginLoadText")} />;
  }

  return (
    <AuthContent
      isLogin
      isConnected={isConnected}
      onAuthenticate={loginHandler}
    />
  );
}

export default LoginScreen;
