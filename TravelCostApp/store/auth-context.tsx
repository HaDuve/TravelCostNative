/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import React from "react";
import { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAxiosAccessToken } from "../util/http";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import PropTypes from "prop-types";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import {
  getAuth,
  deleteUser,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  initializeAuth,
} from "firebase/auth";
import { Alert } from "react-native";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence } from "firebase/auth/react-native";
import {
  secureStoreGetItem,
  secureStoreRemoveItem,
  secureStoreSetItem,
} from "./secure-storage";
import { reloadApp } from "../util/appState";
import safeLogError from "../util/error";
import branch from "react-native-branch";

export const AuthContext = createContext({
  uid: "",
  token: "",
  isAuthenticated: false,
  authenticate: async (token) => {},
  logout: () => {},
  setUserID: async (uid) => {},
  deleteAccount: async () => {},
});

function AuthContextProvider({ children }) {
  const [authToken, setAuthToken] = useState("");
  const [uidString, setuidString] = useState("");

  useEffect(() => {
    async function loadUID() {
      const uid = await secureStoreGetItem("uid");
      setuidString(uid);
    }
    loadUID();
  }, []);

  async function authenticate(token) {
    await secureStoreSetItem("token", token);
    setAuthToken(token);
    setAxiosAccessToken(token);
  }

  function logout() {
    branch.logout();
    setAuthToken(null);
  }

  async function setUserID(uid) {
    setuidString(uid);
    await secureStoreSetItem("uid", uid);
  }

  async function deleteAccount() {
    const firebaseConfig = {
      apiKey: "AIzaSyAPXaokb5pgZ286Ih-ty8ZERoc8nubf1TE",
      authDomain: "travelcostnative.firebaseapp.com",
      databaseURL:
        "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "travelcostnative",
      storageBucket: "travelcostnative.appspot.com",
      messagingSenderId: "1083718280976",
    };
    // assuming initialize App and Auth has never been called before!
    const app = initializeApp(firebaseConfig);
    const auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    // load email and password from async storage
    const email = await secureStoreGetItem("ENCM");
    console.log("deleteAccount ~ email:", email);
    const password = await secureStoreGetItem("ENCP");
    signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      deleteUser(user)
        .then(() => {
          // User deleted.
          console.log("User deleted.");
          Toast.show({
            type: "success",
            text1: i18n.t("toastAccDeleted1"),
            text2: i18n.t("toastAccDeleted2"),
            visibilityTime: 3000,
            autoHide: true,
            onHide: async () => {
              logout();
              await reloadApp();
            },
          });
        })
        .catch((error) => {
          // An error ocurred
          // ...
          safeLogError(error);
        });
    });
    // logout();
  }

  const value = {
    uid: uidString,
    token: authToken,
    isAuthenticated: !!authToken,
    authenticate: authenticate,
    logout: logout,
    setUserID: setUserID,
    deleteAccount: deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;

AuthContextProvider.propTypes = {
  children: PropTypes.node,
};
