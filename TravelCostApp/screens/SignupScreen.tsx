/* eslint-disable react/react-in-jsx-scope */
import { useContext, useEffect, useState } from "react";
import React, { Alert } from "react-native";

import { i18n } from "../i18n/i18n";

import AuthContent from "../components/Auth/AuthContent";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { asyncStoreSafeClear } from "../store/async-storage";
import { UserContext, UserData } from "../store/user-context";
import { createUser } from "../util/auth";
import { setAxiosAccessToken, storeUser, updateUser } from "../util/http";
import { AuthContext } from "../store/auth-context";
import Toast from "react-native-toast-message";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import {
  loadKeys,
  Keys,
  setAttributesAsync,
} from "../components/Premium/PremiumConstants";
import { NetworkContext } from "../store/network-context";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";

function SignupScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);

  const [isConnected, setIsConnected] = useState(
    netCtx.isConnected && netCtx.strongConnection
  );
  useEffect(() => {
    setIsConnected(netCtx.isConnected && netCtx.strongConnection);
  }, [netCtx.isConnected, netCtx.strongConnection]);

  async function signupHandler({ name, email, password }) {
    // Track signup button press
    trackEvent(VexoEvents.SIGNUP_PRESSED, {
      email: email,
    });

    setIsAuthenticating(true);
    const userData: UserData = { userName: name, locale: i18n.locale };
    let { token = "", uid = "" } = {
      token: "",
      uid: "",
    };
    // Check internet connection first
    if (!isConnected) {
      Toast.show({
        type: "error",
        text1: i18n.t("noConnection"),
        text2: i18n.t("checkConnectionError"),
      });
      setIsAuthenticating(false);
      return;
    }
    if (!name) {
      Toast.show({
        type: "error",
        text1: i18n.t("toastNameError1"),
        text2: i18n.t("toastNameError2"),
      });
      setIsAuthenticating(false);
      return;
    }
    try {
      // NECESSARY TRYCATCH
      ({ token, uid } = await createUser(email, password));
      await storeUser(uid, userData);
      await updateUser(uid, {
        userName: name,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: i18n.t("toastEmailError1"),
        text2: i18n.t("toastEmailError2"),
      });
      setIsAuthenticating(false);
      return;
    }
    try {
      // UNESSENTIAL TRYCATCH
      await asyncStoreSafeClear();
      setAxiosAccessToken(token);
      await userCtx.setUserName(name);
      userCtx.setTripHistory([]);

      await userCtx.setFreshlyCreatedTo(true);
      await authCtx.setUserID(uid);
      const { REVCAT_G, REVCAT_A }: Keys = await loadKeys();
      if (REVCAT_A || REVCAT_G) {
        if (Platform.OS === "android") {
          Purchases.configure({
            apiKey: REVCAT_G,
            appUserID: uid,
          });
        } else if (Platform.OS === "ios" || Platform.OS === "macos") {
          Purchases.configure({
            apiKey: REVCAT_A,
            appUserID: uid,
          });
        }
      }
      await Purchases.collectDeviceIdentifiers();
      await setAttributesAsync(email, userData.userName);

      // Track account creation
      trackEvent(VexoEvents.ACCOUNT_CREATED, {
        email: email,
        userName: name,
        locale: userData.locale,
      });
    } catch (error) {
      await authCtx.authenticate(token);
      // console.log("error", error);
    }
    await authCtx.authenticate(token);
  }

  if (isAuthenticating) {
    return <LoadingOverlay message={i18n.t("createUserLoadText")} />;
  }

  return (
    <AuthContent
      isConnected={netCtx.isConnected && netCtx.strongConnection}
      isLogin={false}
      onAuthenticate={signupHandler}
    />
  );
}

export default SignupScreen;
