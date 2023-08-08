/* eslint-disable react/react-in-jsx-scope */
import { useContext, useEffect, useState } from "react";
import React, { Alert } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import AuthContent from "../components/Auth/AuthContent";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { asyncStoreSafeClear } from "../store/async-storage";
import { UserContext } from "../store/user-context";
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
import { BranchEvent } from "react-native-branch";

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
    setIsAuthenticating(true);
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
      //CLEAR
      await asyncStoreSafeClear();
      userCtx.setTripHistory([]);
      // We are online and ready to create User
      const { token, uid } = await createUser(email, password);
      // setup purchases with a inner trycatch so that account gets created anyway
      const { REVCAT_G, REVCAT_A }: Keys = await loadKeys();
      try {
        if (Platform.OS === "android") {
          // Purchases
          Purchases.configure({
            apiKey: REVCAT_G,
            appUserID: uid,
          });
        } else if (Platform.OS === "ios" || Platform.OS === "macos") {
          // Purchases
          Purchases.configure({
            apiKey: REVCAT_A,
            appUserID: uid,
          });
          console.log("SignupScreen REVCAT ~ uid:", uid);
        }
      } catch (error) {
        console.log("SignupScreen ~ revcat error", error);
      }

      //NEW
      const userData = { userName: name };
      await setAttributesAsync(email, userData.userName);
      userCtx.setUserName(name);
      await userCtx.setFreshlyCreatedTo(true);
      await authCtx.setUserID(uid);
      setAxiosAccessToken(token);
      await storeUser(uid, userData);
      await updateUser(uid, {
        userName: name,
      });
      const event = new BranchEvent(BranchEvent.CompleteRegistration);
      await event.logEvent();
      const event2 = new BranchEvent(BranchEvent.Login);
      await event2.logEvent();
      await authCtx.authenticate(token);
    } catch (error) {
      console.log("signupHandler ~ error2", error);
      // Alert.alert(i18n.t("authError"), error.message);
      Alert.alert(i18n.t("authError"), i18n.t("createErrorText"));
      setIsAuthenticating(false);
    }
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
