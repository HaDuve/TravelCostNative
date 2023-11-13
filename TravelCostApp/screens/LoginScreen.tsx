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
import { UserContext, UserData } from "../store/user-context";
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
import safeLogError from "../util/error";

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
    let { token = "", uid = "" } = { token: "", uid: "" };
    let checkUser: UserData = {};
    try {
      // NECESSARY TRYCATCH
      ({ token, uid } = await login(email, password));
      console.log("loginHandler ~ uid:", uid);
      //// START OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
      checkUser = await fetchUser(uid);
      await userCtx.addUserName(checkUser);
      await authCtx.setUserID(uid);
    } catch (error) {
      console.error(error);
      setIsAuthenticating(false);
      authCtx.logout();
    }
    const userData = checkUser;
    tripCtx.setTripid(checkUser.currentTrip);

    console.log("loginHandler ~ checkUser", checkUser);
    // Check if the user logged in but there is no userName, we deleted the account
    if (!checkUser.userName) {
      Toast.show({
        type: "error",
        position: "top",
        text1: i18n.t("exceptionError"),
        text2: i18n.t("tryAgain"),
        visibilityTime: 4000,
      });
      console.log("loginHandler exception error");
      authCtx.logout();
      return;
    }
    let freshlyCreated = checkUser.freshlyCreated;
    if (!checkUser.currentTrip) {
      // we infer freshly created if no current trip exists but we assigned a name already
      console.log(
        "loginHandler ~ we set to freshly because username but no current trip!"
      );
      await userCtx.setFreshlyCreatedTo(true);
      freshlyCreated = true;
    } else {
      await userCtx.setFreshlyCreatedTo(freshlyCreated);
    }
    try {
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

      await setAttributesAsync(email, userData.userName);

      const event = new BranchEvent(BranchEvent.Login);
      await event.logEvent();
      console.log("loginHandler ~ userData", userData);
    } catch (error) {
      safeLogError(error);
    }
    const tripid = userData.currentTrip;
    if (!tripid && freshlyCreated) {
      await authCtx.authenticate(token);
      return;
    }
    try {
      await secureStoreSetItem("currentTripId", tripid);
      await secureStoreSetItem("uid", uid);
      await touchMyTraveler(tripid, uid);

      await tripCtx.fetchAndSetCurrentTrip(tripid);
      await userCtx.loadCatListFromAsyncInCtx(tripid);
      await userCtx.updateTripHistory();
      tripCtx.refresh();
      expCtx.setExpenses([]);
      setMMKVObject("expenses", []);
    } catch (error) {
      safeLogError(error);
    }
    await authCtx.authenticate(token);
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
