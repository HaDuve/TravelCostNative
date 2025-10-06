/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

//Localization
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import Purchases from "react-native-purchases";

import {
  ENTITLEMENT_ID,
  isPremiumMember,
} from "../components/Premium/PremiumConstants";
import { DEBUG_FORCE_OFFLINE } from "../confAppConstants";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
import safeLogError from "../util/error";
import { fetchCategories, fetchTripHistory } from "../util/http";
import { safelyParseJSON } from "../util/jsonParse";

import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";
import { RangeString } from "./expenses-context";
import { getMMKVObject, setMMKVObject } from "./mmkv";
import {
  secureStoreGetItem,
  secureStoreGetObject,
  secureStoreSetItem,
} from "./secure-storage";

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
  setPeriodString: (periodName: RangeString) => {},

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
  loadCatListFromAsyncInCtx: async tripid => {},
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
  const [periodName, setPeriodName] = useState<RangeString>(RangeString.day);
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
    // console.log(
    //   "loadLastCurrencyCountryFromAsync ~ loadLastCurrencyCountryFromAsync:",
    //   loadLastCurrencyCountryFromAsync
    // );
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

  // Load freshlyCreated from storage on mount
  useEffect(() => {
    async function loadFreshlyCreatedFromStorage() {
      try {
        const storedFreshlyCreated =
          await asyncStoreGetObject("freshlyCreated");
        if (storedFreshlyCreated !== null) {
          setFreshlyCreated(storedFreshlyCreated);
        }
      } catch (error) {
        console.error("Error loading freshlyCreated from storage:", error);
      }
    }
    loadFreshlyCreatedFromStorage();
  }, []);

  async function updateTripHistory() {
    const uid = await secureStoreGetItem("uid");
    // console.log("fetch ~ uid:", uid);
    if (!uid || DEBUG_FORCE_OFFLINE) return;
    try {
      const tripHistoryResponse = await fetchTripHistory(uid);
      setTripHistory(tripHistoryResponse);
      setMMKVObject("tripHistory", tripHistoryResponse);
    } catch (error) {
      safeLogError(error);
    }
  }

  useEffect(() => {
    const storedHistory = getMMKVObject("tripHistory");
    if (storedHistory !== null) {
      setTripHistory(storedHistory);
    }
    // Trip History fetch async
    async function asyncUpTripHistory() {
      await updateTripHistory();
    }
    asyncUpTripHistory();
  }, []);

  async function checkPremium() {
    const isPremiumNow = await isPremiumMember();
    // console.log("checkPremium ~ isPremiumNow:", isPremiumNow);
    setIsPremium(isPremiumNow);
    return isPremiumNow;
  }

  useEffect(() => {
    Purchases.addCustomerInfoUpdateListener(info => {
      // handle any changes to purchaserInfo
      if (typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        // Grant user "premium" access
        // console.log("User is premium member");
        setIsPremium(true);
      } else {
        // console.log("User is not premium member");
        setIsPremium(false);
      }
    });
  }, []);

  useEffect(() => {
    async function loadIsPremiumFromAsync() {
      try {
        const uid = await secureStoreGetItem("uid");
        const isPremiumString = await secureStoreGetObject(
          `${uid ?? ""}isPremium`
        );
        if (isPremiumString !== null) {
          const isPremiumNow = safelyParseJSON(isPremiumString);
          // console.log("loadIsPremiumFromAsync ~ isPremiumNow:", isPremiumNow);
          setIsPremium(isPremiumNow);
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadIsPremiumFromAsync();
  }, []);

  useEffect(() => {
    loadLastCurrencyCountryFromAsync();
  }, [loadLastCurrencyCountryFromAsync]);

  function _loadCatListFromMMKV() {
    try {
      const categoryList = getMMKVObject("categoryList");
      if (categoryList !== null) {
        setCatIconNames(categoryList);
        return;
      }
    } catch (error) {
      safeLogError(error);
    }
  }

  /**
   * @param tripid
   * @returns void
   * @description
   * 1. fetches the category list from the server
   * 2. if tripid == "async", it loads the category list from MMKV Storage
   **/
  async function fetchOrLoadCatList(tripid: string) {
    if (tripid == "async") {
      _loadCatListFromMMKV();
      return;
    }
    try {
      const catList = await fetchCategories(tripid);
      setCatIconNames(catList);
    } catch (error) {
      _loadCatListFromMMKV();
    }
  }

  function setPeriodString(periodName: RangeString) {
    setPeriodName(periodName);
  }

  async function addUserName(userData: UserData) {
    // // console.log("addUser ~ UserData", UserData);
    if (!userData || !userData.userName) {
      // console.log("addUser ~ no UserData to add Username!");
      return;
    }
    setUserName(userData.userName);
    await saveUserNameInStorage(userData.userName);
  }

  async function setFreshlyCreatedTo(bool: boolean) {
    setFreshlyCreated(bool);
    await asyncStoreSetObject("freshlyCreated", bool);
  }

  function deleteUser(id: string) {
    // // console.log("deleteUser ~ id", id);
    Alert.alert(i18n.t("alertDeleteContextNotImplemented"));
  }
  async function setUserName(name: string) {
    // // console.log("setUserName ~ name", name);
    if (!name || name?.length < 1) return;
    setName(name);
    await saveUserNameInStorage(name);
  }

  async function saveUserNameInStorage(name: string) {
    // console.log("saveUserNameInStorage ~ userName", name);
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
    userName,
    setUserName,
    periodName,
    setPeriodString,

    freshlyCreated,
    setFreshlyCreatedTo,

    needsTour,
    setNeedsTour,

    tripHistory,
    setTripHistory,

    lastCurrency,
    setLastCurrency,
    lastCountry,
    setLastCountry,

    addUserName,
    deleteUser,
    isOnline,
    setIsOnline,
    saveUserNameInStorage,
    loadUserNameFromStorage,
    // checkConnectionUpdateUser: checkConnectionUpdateUser,

    isPremium,
    checkPremium,
    loadCatListFromAsyncInCtx: fetchOrLoadCatList,
    catIconNames,

    loadLastCurrencyCountryFromAsync,

    setIsShowingGraph,
    isShowingGraph,
    updateTripHistory,
    isSendingOfflineQueueMutex,
    setIsSendingOfflineQueueMutex,
    hasNewChanges,
    setHasNewChanges,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
