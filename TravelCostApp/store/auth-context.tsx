/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import React from "react";
import { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAxiosAccessToken } from "../util/http";
import PropTypes from "prop-types";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import {
  getAuth,
  deleteUser,
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Alert } from "react-native";
import { initializeApp } from "firebase/app";

export const AuthContext = createContext({
  uid: "",
  token: "",
  isAuthenticated: false,
  authenticate: (token) => {},
  offlineAuthenticate: (token) => {},
  logout: async () => {},
  setUserID: (uid) => {},
  deleteAccount: async () => {},
});

function AuthContextProvider({ children }) {
  const [authToken, setAuthToken] = useState();
  const [uidString, setuidString] = useState("");
  const [customToken, setCustomToken] = useState("");
  console.log("AuthContextProvider ~ customToken:", customToken);

  function authenticate(token) {
    setAuthToken(token);
    AsyncStorage.setItem("token", token);
    setAxiosAccessToken(token);
  }

  function offlineAuthenticate(token) {
    setAuthToken(token);
    AsyncStorage.setItem("token", token);
  }

  async function logout() {
    setAuthToken(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("uid");
  }

  function setUserID(uid) {
    setuidString(uid);
    AsyncStorage.setItem("uid", uid);
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
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    // load email and password from async storage
    const email = await AsyncStorage.getItem("email");
    const password = await AsyncStorage.getItem("password");
    signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      deleteUser(user)
        .then(() => {
          // User deleted.
          console.log("User deleted.");
          Toast.show({
            type: "success",
            text1: "Account Deleted",
            text2: "Your account has been deleted successfully.",
            visibilityTime: 3000,
            autoHide: true,
            onHide: () => {
              logout();
            },
          });
        })
        .catch((error) => {
          // An error ocurred
          // ...
          console.log(error);
        });
    });
    // logout();
  }

  const value = {
    uid: uidString,
    token: authToken,
    isAuthenticated: !!authToken,
    authenticate: authenticate,
    offlineAuthenticate: offlineAuthenticate,
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
