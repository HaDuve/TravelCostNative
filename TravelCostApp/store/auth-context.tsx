/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import React from "react";
import { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAxiosAccessToken } from "../util/axios-config";
import { getValidIdToken, testFirebaseAuth } from "../util/firebase-auth";
import { clearLastFetchTimestamp } from "../util/last-fetch-timestamp";

import { i18n } from "../i18n/i18n";

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
// import { getReactNativePersistence } from "firebase/auth";
import {
  secureStoreGetItem,
  secureStoreRemoveItem,
  secureStoreSetItem,
} from "./secure-storage";
import { reloadApp } from "../util/appState";
import safeLogError from "../util/error";

export const AuthContext = createContext({
  uid: "",
  token: "",
  isAuthenticated: false,
  authenticate: async (token) => {},
  logout: (tripid?: string) => {},
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

  // Initialize authentication on app startup
  useEffect(() => {
    async function initializeAuth() {
      try {
        const validToken = await getValidIdToken();
        if (validToken) {
          setAuthToken(validToken);
          setAxiosAccessToken(validToken);
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
    const password = await secureStoreGetItem("ENCP");
    signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      deleteUser(user)
        .then(() => {
          // User deleted.
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
