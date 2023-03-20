/* eslint-disable react/react-in-jsx-scope */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useState } from "react";
import React, { Alert, KeyboardAvoidingView } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import AuthContent from "../components/Auth/AuthContent";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { asyncStoreSafeClear } from "../store/async-storage";
import { UserContext } from "../store/user-context";
import { createUser } from "../util/auth";
import { storeUser, updateUser } from "../util/http";
import { AuthContext } from "../store/auth-context";
import Toast from "react-native-toast-message";

function SignupScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);

  async function signupHandler({ name, email, password }) {
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
      // We are online and ready to create User
      const { token, uid } = await createUser(email, password);

      //CLEAR
      await asyncStoreSafeClear();
      userCtx.setTripHistory([]);
      //NEW
      const userData = { userName: name };
      await storeUser(uid, userData);
      await updateUser(uid, {
        userName: name,
      });
      userCtx.setUserName(name);
      userCtx.setFreshlyCreatedTo(true);
      authCtx.setUserID(uid);
      authCtx.authenticate(token);
    } catch (error) {
      console.log("signupHandler ~ error2", error);
      Alert.alert(i18n.t("authError"), i18n.t("createErrorText"));

      setIsAuthenticating(false);
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message={i18n.t("createUserLoadText")} />;
  }

  return (
    <KeyboardAvoidingView behavior={"position"}>
      <AuthContent isLogin={false} onAuthenticate={signupHandler} />
    </KeyboardAvoidingView>
  );
}

export default SignupScreen;
