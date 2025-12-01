import AuthContent from "../components/Auth/AuthContent";
import React, { useContext, useEffect, useState } from "react";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { login } from "../util/auth";
import { Platform } from "react-native";

import { i18n } from "../i18n/i18n";

import { AuthContext } from "../store/auth-context";
import { UserContext, UserData } from "../store/user-context";
import { fetchUser, touchMyTraveler, updateUser } from "../util/http";
import { TripContext } from "../store/trip-context";
import Toast from "react-native-toast-message";
import Purchases from "react-native-purchases";
import {
  loadKeys,
  Keys,
  setAttributesAsync,
} from "../components/Premium/PremiumConstants";
import { NetworkContext } from "../store/network-context";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";
import { secureStoreSetItem } from "../store/secure-storage";
import { ExpensesContext } from "../store/expenses-context";
import { setMMKVObject } from "../store/mmkv";
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
    // Track login button press
    trackEvent(VexoEvents.LOGIN_PRESSED, {
      email: email,
    });

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
      ({ token, uid } = await login(email, password));
      if (!uid) throw new Error("No uid found!");
      if (!token) throw new Error("No token found!");
      checkUser = await fetchUser(uid);
      if (!checkUser) throw new Error("No user found!");
      checkUser.locale = i18n.locale;
      await updateUser(uid, checkUser);
      await userCtx.addUserName(checkUser);
      await authCtx.setUserID(uid);
    } catch (error) {
      safeLogError(error);
      setIsAuthenticating(false);
      authCtx.logout(tripCtx.tripid);
    }
    const userData = checkUser;
    // Check if the user logged in but there is no userName, we deleted the account
    if (!checkUser.userName) {
      Toast.show({
        type: "error",
        position: "top",
        text1: i18n.t("exceptionError"),
        text2: i18n.t("tryAgain"),
        visibilityTime: 4000,
      });
      authCtx.logout(tripCtx.tripid);
      return;
    }
    tripCtx.setTripid(checkUser.currentTrip);
    let freshlyCreated = checkUser.freshlyCreated;
    if (!checkUser.currentTrip) {
      // we infer freshly created if no current trip exists but we assigned a name already
      //   "loginHandler ~ we set to freshly because username but no current trip!"
      // );
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
      }
      await Purchases.collectDeviceIdentifiers();
      await setAttributesAsync(email, userData.userName);

      // Branch.io removed - no event logging
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
