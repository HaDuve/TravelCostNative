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
      await setAttributesAsync(email, userData.userName);
      const event = new BranchEvent(BranchEvent.CompleteRegistration);
      await event.logEvent();
      const event2 = new BranchEvent(BranchEvent.Login);
      await event2.logEvent();
    } catch (error) {
      await authCtx.authenticate(token);
      console.log("error", error);
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
