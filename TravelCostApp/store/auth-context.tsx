/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import PropTypes from "prop-types";
import React, { createContext, useEffect, useState } from "react";
import { Toast } from "react-native-toast-message/lib/src/Toast";

import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { reloadApp } from "../util/appState";
import { setAxiosAccessToken } from "../util/axios-config";
import safeLogError from "../util/error";
import { getValidIdToken, testFirebaseAuth } from "../util/firebase-auth";
import { clearLastFetchTimestamp } from "../util/last-fetch-timestamp";

//Localization

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import {
  deleteUser,
  signInWithEmailAndPassword,
  initializeAuth,
} from "firebase/auth";
import { initializeApp } from "firebase/app";

// import { getReactNativePersistence } from "firebase/auth";
import { secureStoreGetItem, secureStoreSetItem } from "./secure-storage";

export const AuthContext = createContext({
  uid: "",
  token: "",
  isAuthenticated: false,
  authenticate: async token => {},
  logout: (tripid?: string) => {},
  setUserID: async uid => {},
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

  // Initialize authentication on app startup
  useEffect(() => {
    async function initializeAuth() {
      try {
        const validToken = await getValidIdToken();
        if (validToken) {
          setAuthToken(validToken);
          setAxiosAccessToken(validToken);
          console.log(
            "[AUTH-CONTEXT] Authentication initialized with valid token",
            validToken
          );
        } else {
          console.log(
            "[AUTH-CONTEXT] No valid token found, user needs to login"
          );
        }
      } catch (error) {
        console.error("[AUTH-CONTEXT] Auth initialization error:", error);
      }
    }
    initializeAuth();
  }, []);

  async function authenticate(token) {
    // The token is already stored by the login function via storeAuthData
    // Just set the local state and test the authentication
    setAuthToken(token);
    setAxiosAccessToken(token);

    // Test the authentication to ensure it's working
    try {
      const authTest = await testFirebaseAuth();
      if (authTest.success) {
        console.log("[AUTH-CONTEXT] Authentication verified successfully");
      } else {
        console.warn(
          "[AUTH-CONTEXT] Authentication test failed:",
          authTest.error
        );
      }
    } catch (error) {
      console.error("[AUTH-CONTEXT] Authentication test error:", error);
    }
  }

  function logout(tripid?: string) {
    setAuthToken(null);
    if (tripid) {
      clearLastFetchTimestamp(tripid);
    }
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
    const auth = initializeAuth(app);
    // load email and password from async storage
    const email = await secureStoreGetItem("ENCM");
    // console.log("deleteAccount ~ email:", email);
    const password = await secureStoreGetItem("ENCP");
    signInWithEmailAndPassword(auth, email, password).then(userCredential => {
      // Signed in
      const user = userCredential.user;
      deleteUser(user)
        .then(() => {
          // User deleted.
          // console.log("User deleted.");
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
        .catch(error => {
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
    authenticate,
    logout,
    setUserID,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;

AuthContextProvider.propTypes = {
  children: PropTypes.node,
};
