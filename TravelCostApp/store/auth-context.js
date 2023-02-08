import React from "react";
import { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAxiosAccessToken } from "../util/http";

export const AuthContext = createContext({
  uid: "",
  token: "",
  isAuthenticated: false,
  authenticate: (token) => {},
  offlineAuthenticate: (token) => {},
  logout: () => {},
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

  function logout() {
    setAuthToken(null);
    AsyncStorage.removeItem("token");
    AsyncStorage.removeItem("uid");
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
