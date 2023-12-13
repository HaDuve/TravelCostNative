/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, {
  createContext,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
import { Alert } from "react-native";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "./async-storage";
import {
  ENTITLEMENT_ID,
  isPremiumMember,
} from "../components/Premium/PremiumConstants";
import { fetchCategories, fetchTripHistory } from "../util/http";
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
import Purchases from "react-native-purchases";
import safeLogError from "../util/error";
import set from "react-native-reanimated";

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
  locale?: string;
}

export const UserContext = createContext({
  userName: "",
  setUserName: async (name: string) => {},
  periodName: RangeString.day,
  setPeriodString: (string: string) => {},

  lastCurrency: "",
  setLastCurrency: (string: string) => {},
  lastCountry: "",
  setLastCountry: (string: string) => {},

  addUserName: async ({ userName }: UserData) => {},
  deleteUser: (uid: string) => {},

  freshlyCreated: false,
  setFreshlyCreatedTo: async (bool: boolean) => {},
  needsTour: false,
  setNeedsTour: (bool: boolean) => {},

  tripHistory: [],
  setTripHistory: (tripHistory: string[]) => {},
  updateTripHistory: async () => {},
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
  isSendingOfflineQueueMutex: false,
  setIsSendingOfflineQueueMutex: (bool: boolean) => {},
  hasNewChanges: false,
  setHasNewChanges: (bool: boolean) => {},
});

function UserContextProvider({ children }) {
  const [userName, setName] = useState("");
  const [freshlyCreated, setFreshlyCreated] = useState(false);
  const [needsTour, setNeedsTour] = useState(false);
  const [periodName, setPeriodName] = useState("day");
  const [isOnline, setIsOnline] = useState(false);
  const [lastCurrency, setLastCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  // useState for cat iconName list
  const [catIconNames, setCatIconNames] = useState([]);
  const [isShowingGraph, setIsShowingGraph] = useState(true);
  const [tripHistory, setTripHistory] = useState([]);
  const [isSendingOfflineQueueMutex, setIsSendingOfflineQueueMutex] =
    useState(false);
  const [hasNewChanges, setHasNewChanges] = useState(false);

  const loadLastCurrencyCountryFromAsync = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadLastCurrencyCountryFromAsync();
  }, [loadLastCurrencyCountryFromAsync]);

  async function updateTripHistory() {
    const uid = await secureStoreGetItem("uid");
    console.log("fetch ~ uid:", uid);
    if (!uid) return;
    try {
      const tripHistoryResponse = await fetchTripHistory(uid);
      console.log("fetch ~ tripHistoryResponse:", tripHistoryResponse);
      setTripHistory(tripHistoryResponse);
    } catch (error) {
      safeLogError(error);
    }
  }
  useEffect(() => {
    // Trip History fetch

    updateTripHistory();
  }, []);

  async function checkPremium() {
    const isPremiumNow = await isPremiumMember();
    console.log("checkPremium ~ isPremiumNow:", isPremiumNow);
    setIsPremium(isPremiumNow);
    return isPremiumNow;
  }
  useEffect(() => {
    Purchases.addCustomerInfoUpdateListener((info) => {
      // handle any changes to purchaserInfo
      if (typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        // Grant user "premium" access
        console.log("User is premium member");
        setIsPremium(true);
      } else {
        console.log("User is not premium member");
        setIsPremium(false);
      }
    });
  }, []);

  useEffect(() => {
    async function loadIsPremiumFromAsync() {
      try {
        const uid = await secureStoreGetItem("uid");
        const isPremiumString = await secureStoreGetObject(
          uid ?? "" + "isPremium"
        );
        if (isPremiumString !== null) {
          const isPremiumNow = JSON.parse(isPremiumString);
          console.log("loadIsPremiumFromAsync ~ isPremiumNow:", isPremiumNow);
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

  /**
   * @param tripid
   * @returns void
   * @description
   * 1. fetches the category list from the server
   * 2. if tripid == "async", it loads the category list from async storage
   **/
  async function fetchOrLoadCatList(tripid: string) {
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

  async function addUserName(userData: UserData) {
    // console.log("addUser ~ UserData", UserData);
    if (!userData || !userData.userName) {
      console.log("addUser ~ no UserData to add Username!");
      return;
    }
    setUserName(userData.userName);
    await saveUserNameInStorage(userData.userName);
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
  async function setUserName(name: string) {
    // console.log("setUserName ~ name", name);
    if (!name || name?.length < 1) return;
    setName(name);
    await saveUserNameInStorage(name);
  }

  async function saveUserNameInStorage(name: string) {
    console.log("saveUserNameInStorage ~ userName", name);
    await secureStoreSetItem("userName", name);
  }

  async function loadUserNameFromStorage() {
    const _userName = await secureStoreGetItem("userName");
    if (_userName) {
      const trimmedName = _userName.replaceAll('"', "").trim();
      setName(trimmedName);
      if (trimmedName != _userName) await saveUserNameInStorage(trimmedName);
    }
  }

  const value = {
    userName: userName,
    setUserName: setUserName,
    periodName: periodName,
    setPeriodString: setPeriodString,

    freshlyCreated: freshlyCreated,
    setFreshlyCreatedTo: setFreshlyCreatedTo,

    needsTour: needsTour,
    setNeedsTour: setNeedsTour,

    tripHistory: tripHistory,
    setTripHistory: setTripHistory,

    lastCurrency: lastCurrency,
    setLastCurrency: setLastCurrency,
    lastCountry: lastCountry,
    setLastCountry: setLastCountry,

    addUserName: addUserName,
    deleteUser: deleteUser,
    isOnline: isOnline,
    setIsOnline: setIsOnline,
    saveUserNameInStorage: saveUserNameInStorage,
    loadUserNameFromStorage: loadUserNameFromStorage,
    // checkConnectionUpdateUser: checkConnectionUpdateUser,

    isPremium: isPremium,
    checkPremium: checkPremium,
    loadCatListFromAsyncInCtx: fetchOrLoadCatList,
    catIconNames: catIconNames,

    loadLastCurrencyCountryFromAsync: loadLastCurrencyCountryFromAsync,

    setIsShowingGraph: setIsShowingGraph,
    isShowingGraph: isShowingGraph,
    updateTripHistory: updateTripHistory,
    isSendingOfflineQueueMutex: isSendingOfflineQueueMutex,
    setIsSendingOfflineQueueMutex: setIsSendingOfflineQueueMutex,
    hasNewChanges: hasNewChanges,
    setHasNewChanges: setHasNewChanges,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;

UserContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
