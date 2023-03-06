/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useReducer, useState } from "react";
import { Alert } from "react-native";
import { asyncStoreGetItem, asyncStoreSetObject } from "./async-storage";
import * as Device from "expo-device";
import { checkInternetConnection } from "react-native-offline";
import Toast from "react-native-toast-message";
import { DEBUG_FORCE_OFFLINE } from "../confApp";

export const UserContext = createContext({
  userName: "",
  setUserName: (name: string) => {},
  periodName: "day",
  setPeriodString: (string: string) => {},

  lastCurrency: "",
  setLastCurrency: (string: string) => {},
  lastCountry: "",
  setLastCountry: (string: string) => {},

  addUser: ({ userName }) => {},
  deleteUser: (uid: string) => {},

  addTripHistory: (tripid: string) => {},
  setTripHistory: (trips: string[]) => {},
  getTripHistory: (): string[] => {
    return [""];
  },
  deleteTripHistory: (tripid: string) => {},

  freshlyCreated: false,
  setFreshlyCreatedTo: (bool: boolean) => {},

  isOnline: false,
  setIsOnline: (bool: boolean) => {},
  saveUserNameInStorage: async (name: string) => {},
  loadUserNameFromStorage: async () => {},
  checkConnectionUpdateUser: async () => {
    return true;
  },
});

function tripsReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET": {
      const inverted = action.payload.reverse();
      return inverted;
    }
    case "DELETE":
      return state.filter((trip) => trip.id !== action.payload);
    default:
      return state;
  }
}

function UserContextProvider({ children }) {
  const [userName, setName] = useState("");
  const [freshlyCreated, setFreshlyCreated] = useState(false);
  const [periodName, setPeriodName] = useState("day");
  const [isOnline, setIsOnline] = useState(true);
  const [tripsState, dispatch] = useReducer(tripsReducer, []);
  const [lastCurrency, setLastCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");

  function setPeriodString(periodName: string) {
    setPeriodName(periodName);
  }
  function addTripHistory(tripid: string) {
    // console.log("!!!!!!! addTripHistory ~ tripid", tripid);
    dispatch({ type: "ADD", payload: [tripid] });
  }

  function setTripHistory(trips: string[]) {
    // console.log("setTripHistory ~ trips", trips);
    dispatch({ type: "SET", payload: trips });
  }

  function deleteTripHistory(tripid: string) {
    // console.log("deleteTripHistory ~ tripid", tripid);
    dispatch({ type: "DELETE", payload: tripid });
  }

  function addUser(UserData: any) {
    // console.log("addUser ~ UserData", UserData);
    if (!UserData || !UserData.userName) {
      console.log("addUser ~ no UserData to add Username!");
      return;
    }
    setUserName(UserData.userName);
    saveUserNameInStorage(UserData.userName);
  }

  function setFreshlyCreatedTo(bool: boolean) {
    // console.log("setFreshlyCreatedTo ~ bool", bool);
    setFreshlyCreated(bool);
    asyncStoreSetObject("freshlyCreated", bool);
  }

  function deleteUser(id: string) {
    // console.log("deleteUser ~ id", id);
    Alert.alert("delete context not implemented");
  }
  function setUserName(name: string) {
    // console.log("setUserName ~ name", name);
    if (!name || name.length < 1) return;
    setName(name);
  }

  function getTripHistory() {
    return tripsState;
  }

  async function saveUserNameInStorage(name: string) {
    // console.log("saveUserNameInStorage ~ userName", name);
    await asyncStoreSetObject("userName", name);
  }

  async function loadUserNameFromStorage() {
    console.log("loadUserNameFromStorage ~ userName", userName);
    asyncStoreGetItem("userName").then((name) => {
      if (name) {
        console.log("asyncStoreGetItem ~ name:", name);
        setName(name.replaceAll('"', ""));
      }
    });
  }

  async function checkConnectionUpdateUser() {
    // if app is not running on emulator, always set forceOffline to false
    let forceOffline = DEBUG_FORCE_OFFLINE;
    if (Device.isDevice) forceOffline = false;
    try {
      const newIsOnline = await checkInternetConnection(
        forceOffline
          ? "https://www.existiertnichtasdasjdnkajsdjnads.de"
          : "https://www.google.com/",
        15000,
        true,
        "HEAD"
      );
      setIsOnline(newIsOnline);
      return newIsOnline;
    } catch (error) {
      console.log(error);
    }
  }

  const value = {
    userName: userName,
    setUserName: setUserName,
    periodName: periodName,
    setPeriodString: setPeriodString,

    freshlyCreated: freshlyCreated,
    setFreshlyCreatedTo: setFreshlyCreatedTo,

    addTripHistory: addTripHistory,
    setTripHistory: setTripHistory,
    getTripHistory: getTripHistory,
    deleteTripHistory: deleteTripHistory,

    lastCurrency: lastCurrency,
    setLastCurrency: setLastCurrency,
    lastCountry: lastCountry,
    setLastCountry: setLastCountry,

    addUser: addUser,
    deleteUser: deleteUser,
    isOnline: isOnline,
    setIsOnline: setIsOnline,
    saveUserNameInStorage: saveUserNameInStorage,
    loadUserNameFromStorage: loadUserNameFromStorage,
    checkConnectionUpdateUser: checkConnectionUpdateUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
