/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useEffect, useReducer, useState } from "react";
import { Alert } from "react-native";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetObject,
} from "./async-storage";
import { isPremiumMember } from "../components/Premium/PremiumConstants";
import { fetchCategories } from "../util/http";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PropTypes from "prop-types";
import NetInfo from "@react-native-community/netinfo";
import {
  secureStoreGetItem,
  secureStoreGetObject,
  secureStoreSetItem,
  secureStoreSetObject,
} from "./secure-storage";
import { isConnectionFastEnough } from "../util/connectionSpeed";
import { RangeString } from "./expenses-context";

export interface UserData {
  uid?: string;
  userName?: string;
  tripHistory?: string[];
  currentTrip?: string;
  lastCurrency?: string;
  lastCountry?: string;
  freshlyCreated?: boolean;
  needsTour?: boolean;
  isPremium?: boolean;
}

export const UserContext = createContext({
  userName: "",
  setUserName: (name: string) => {},
  periodName: RangeString.day,
  setPeriodString: (string: string) => {},

  lastCurrency: "",
  setLastCurrency: (string: string) => {},
  lastCountry: "",
  setLastCountry: (string: string) => {},

  addUser: ({ userName }: UserData) => {},
  deleteUser: (uid: string) => {},

  addTripHistory: (tripid: string) => {},
  setTripHistory: (trips: string[]) => {},
  getTripHistory: (): string[] => {
    return [""];
  },
  deleteTripHistory: (tripid: string) => {},

  freshlyCreated: false,
  setFreshlyCreatedTo: (bool: boolean) => {},
  needsTour: false,
  setNeedsTour: (bool: boolean) => {},

  isOnline: false,
  setIsOnline: (bool: boolean) => {},
  saveUserNameInStorage: async (name: string) => {},
  loadUserNameFromStorage: async () => {},
  isPremium: false,
  checkPremium: async (): Promise<boolean> => {
    return false;
  },
  loadCatListFromAsyncInCtx: async (tripid) => {},
  catIconNames: [],
  loadLastCurrencyCountryFromAsync: async () => {},
  setIsShowingGraph: (bool: boolean) => {},
  isShowingGraph: true,
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
  const [needsTour, setNeedsTour] = useState(false);
  const [periodName, setPeriodName] = useState("day");
  const [isOnline, setIsOnline] = useState(true);
  const [tripsState, dispatch] = useReducer(tripsReducer, []);
  const [lastCurrency, setLastCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  // useState for cat iconName list
  const [catIconNames, setCatIconNames] = useState([]);
  const [isShowingGraph, setIsShowingGraph] = useState(true);

  async function loadLastCurrencyCountryFromAsync() {
    console.log(
      "loadLastCurrencyCountryFromAsync ~ loadLastCurrencyCountryFromAsync:",
      loadLastCurrencyCountryFromAsync
    );
    try {
      const lastCurrencyString = await secureStoreGetItem("lastCurrency");
      const lastCountryString = await secureStoreGetItem("lastCountry");
      if (lastCurrencyString !== null && lastCountryString !== null) {
        setLastCountry(lastCountryString);
        setLastCurrency(lastCurrencyString);
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }
  useEffect(() => {
    loadLastCurrencyCountryFromAsync();
  }, []);

  async function checkPremium() {
    // allow offline users to get premium
    const { isFastEnough } = await isConnectionFastEnough();
    if (!isFastEnough) {
      return isPremium;
    }
    const isPremiumNow = await isPremiumMember();
    await secureStoreSetObject("isPremium", isPremiumNow);
    setIsPremium(isPremiumNow);
    return isPremiumNow;
  }
  useEffect(() => {
    async function loadIsPremiumFromAsync() {
      try {
        const isPremiumString = await secureStoreGetObject("isPremium");
        if (isPremiumString !== null) {
          const isPremiumNow = JSON.parse(isPremiumString);
          setIsPremium(isPremiumNow);
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadIsPremiumFromAsync();
  }, []);

  async function _loadCatListFromAsync() {
    try {
      const categoryListString = await AsyncStorage.getItem("categoryList");
      if (categoryListString !== null) {
        const list = JSON.parse(categoryListString);
        // console.log("loadCategoryList ~ list:", list);
        setCatIconNames(list);
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadCatListFromAsyncInCtx(tripid: string) {
    if (tripid == "async") {
      await _loadCatListFromAsync();
    } else {
      try {
        const catList = await fetchCategories(tripid);
        setCatIconNames(catList);
      } catch (error) {
        await _loadCatListFromAsync();
      }
    }
  }

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

  function addUser(userData: UserData) {
    // console.log("addUser ~ UserData", UserData);
    if (!userData || !userData.userName) {
      console.log("addUser ~ no UserData to add Username!");
      return;
    }
    setUserName(userData.userName);
    saveUserNameInStorage(userData.userName);
  }

  async function setFreshlyCreatedTo(bool: boolean) {
    // console.log("setFreshlyCreatedTo ~ bool", bool);
    setFreshlyCreated(bool);
    await asyncStoreSetObject("freshlyCreated", bool);
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
    await asyncStoreGetItem("userName").then((name) => {
      if (name) {
        console.log("asyncStoreGetItem ~ name:", name);
        setName(name.replaceAll('"', ""));
      }
    });
  }

  // async function checkConnectionUpdateUser() {
  //   let forceOffline = DEBUG_FORCE_OFFLINE;
  //   if (Device.isDevice) forceOffline = false;

  //   try {
  //     const newIsOnline = await checkInternetConnection(
  //       forceOffline
  //         ? "https://www.existiertnichtasdasjdnkajsdjnads.de"
  //         : "https://www.google.com/",
  //       TIMEOUT,
  //       true,
  //       "HEAD"
  //     );
  //     setIsOnline(newIsOnline);
  //     return newIsOnline;
  //   } catch (error) {
  //     console.log(error);

  //     // Retry the check up to 3 times if the error is a timeout error
  //     if (error.name === "TimeoutError") {
  //       let retries = RETRIES;
  //       while (retries > 0) {
  //         retries--;
  //         console.log(`Retrying connection check (${retries} retries left)...`);
  //         // show toast informing about bad internet connection
  //         Toast.show({
  //           type: "error",
  //           text1: "Bad internet connection",
  //           text2: "Retrying connection check...",
  //         });
  //         try {
  //           const newIsOnline = await checkInternetConnection(
  //             forceOffline
  //               ? "https://www.existiertnichtasdasjdnkajsdjnads.de"
  //               : "https://www.google.com/",
  //             TIMEOUT * (3 - retries),
  //             true,
  //             "HEAD"
  //           );
  //           setIsOnline(newIsOnline);
  //           return newIsOnline;
  //         } catch (error) {
  //           console.log(error);
  //         }
  //       }
  //     }

  //     // Display an error message to the user
  //     Toast.show({
  //       text1: "No internet connection",
  //       text2: "Please check your connection and try again",
  //       type: "error",
  //     });

  //     return false;
  //   }
  // }

  const value = {
    userName: userName,
    setUserName: setUserName,
    periodName: periodName,
    setPeriodString: setPeriodString,

    freshlyCreated: freshlyCreated,
    setFreshlyCreatedTo: setFreshlyCreatedTo,

    needsTour: needsTour,
    setNeedsTour: setNeedsTour,

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
    // checkConnectionUpdateUser: checkConnectionUpdateUser,

    isPremium: isPremium,
    checkPremium: checkPremium,
    loadCatListFromAsyncInCtx: loadCatListFromAsyncInCtx,
    catIconNames: catIconNames,

    loadLastCurrencyCountryFromAsync: loadLastCurrencyCountryFromAsync,

    setIsShowingGraph: setIsShowingGraph,
    isShowingGraph: isShowingGraph,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;

UserContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
