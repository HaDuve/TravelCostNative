/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import React from "react";
import { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAxiosAccessToken } from "../util/http";
import PropTypes from "prop-types";

export const AuthContext = createContext({
  uid: "",
  token: "",
  isAuthenticated: false,
  authenticate: (token) => {},
  offlineAuthenticate: (token) => {},
  logout: async () => {},
  setUserID: (uid) => {},
});

function AuthContextProvider({ children }) {
  const [authToken, setAuthToken] = useState();
  const [uidString, setuidString] = useState("");

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

  const value = {
    uid: uidString,
    token: authToken,
    isAuthenticated: !!authToken,
    authenticate: authenticate,
    offlineAuthenticate: offlineAuthenticate,
    logout: logout,
    setUserID: setUserID,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;

AuthContextProvider.propTypes = {
  children: PropTypes.node,
};
