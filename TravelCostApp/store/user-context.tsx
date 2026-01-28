/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { trackAsyncFunction, logRender } from "../util/performance";
import { Alert } from "react-native";

import { i18n } from "../i18n/i18n";

import { asyncStoreSetObject } from "./async-storage";
import {
  ENTITLEMENT_ID,
  isPremiumMember,
} from "../components/Premium/PremiumConstants";
import { fetchCategories, fetchTripHistory } from "../util/http";
import PropTypes from "prop-types";
import {
  secureStoreGetItem,
  secureStoreGetObject,
  secureStoreSetItem,
} from "./secure-storage";
import { RangeString } from "./expenses-context";
import Purchases from "react-native-purchases";
import safeLogError from "../util/error";
import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "./mmkv";
import { DEBUG_FORCE_OFFLINE } from "../confAppConstants";
import { safelyParseJSON } from "../util/jsonParse";

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

export type UserContextType = {
  userName: string;
  setUserName: (name: string) => void;
  periodName: RangeString;
  setPeriodString: (string: string) => void;

  lastCurrency: string;
  setLastCurrency: (string: string) => void;
  lastCountry: string;
  setLastCountry: (string: string) => void;

  addUserName: (userData: UserData) => void;
  deleteUser: (uid: string) => void;

  freshlyCreated: boolean;
  setFreshlyCreatedTo: (bool: boolean) => void;
  needsTour: boolean;
  setNeedsTour: (bool: boolean) => void;

  tripHistory: string[];
  setTripHistory: (tripHistory: string[]) => void;
  updateTripHistory: () => void;
  isOnline: boolean;
  setIsOnline: (bool: boolean) => void;
  saveUserNameInStorage: (name: string) => void;
  loadUserNameFromStorage: () => void;
  isPremium: boolean;
  checkPremium: () => Promise<boolean>;
  loadCatListFromAsyncInCtx: (tripid: string) => void;
  catIconNames: string[];
  loadLastCurrencyCountryFromAsync: () => void;
  setIsShowingGraph: (bool: boolean) => void;
  isShowingGraph: boolean;
  isSendingOfflineQueueMutex: boolean;
  setIsSendingOfflineQueueMutex: (bool: boolean) => void;
  hasNewChanges: boolean;
  setHasNewChanges: (bool: boolean) => void;
};

export const UserContext = createContext<UserContextType>({
  userName: "",
  setUserName: (name: string) => {},
  periodName: RangeString.day,
  setPeriodString: (string: string) => {},

  lastCurrency: "",
  setLastCurrency: (string: string) => {},
  lastCountry: "",
  setLastCountry: (string: string) => {},

  addUserName: (userData: UserData) => {},
  deleteUser: (uid: string) => {},

  freshlyCreated: false,
  setFreshlyCreatedTo: (bool: boolean) => {},
  needsTour: false,
  setNeedsTour: (bool: boolean) => {},

  tripHistory: [],
  setTripHistory: (tripHistory: string[]) => {},
  updateTripHistory: () => {},
  isOnline: false,
  setIsOnline: (bool: boolean) => {},
  saveUserNameInStorage: (name: string) => {},
  loadUserNameFromStorage: () => {},
  isPremium: false,
  checkPremium: async (): Promise<boolean> => {
    return false;
  },
  loadCatListFromAsyncInCtx: (tripid: string) => {},
  catIconNames: [],
  loadLastCurrencyCountryFromAsync: () => {},
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
  const [catIconNames, setCatIconNames] = useState<string[]>([]);
  const [isShowingGraph, setIsShowingGraph] = useState(true);
  const [tripHistory, setTripHistory] = useState<string[]>([]);
  const [isSendingOfflineQueueMutex, setIsSendingOfflineQueueMutex] =
    useState(false);
  const [hasNewChanges, setHasNewChanges] = useState(false);

  // Track renders
  React.useEffect(() => {
    logRender("UserContextProvider", "state changed", [
      "userName",
      "tripHistory",
      "catIconNames",
    ]);
  });

  const loadLastCurrencyCountryFromAsync = useCallback(async () => {
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

  const updateTripHistory = useCallback(async () => {
    const uid = await trackAsyncFunction(
      secureStoreGetItem,
      "secureStoreGetItem_uid",
      "context-update",
    )("uid");
    if (!uid || DEBUG_FORCE_OFFLINE) return;
    try {
      const tripHistoryResponse = await trackAsyncFunction(
        fetchTripHistory,
        "fetchTripHistory",
        "context-update",
      )(uid);
      setTripHistory(tripHistoryResponse);
      setMMKVObject(MMKV_KEYS.TRIP_HISTORY, tripHistoryResponse);
    } catch (error) {
      safeLogError(error);
    }
  }, []);
  useEffect(() => {
    const storedHistory = getMMKVObject(MMKV_KEYS.TRIP_HISTORY);
    if (storedHistory !== null) {
      setTripHistory(storedHistory);
    }
    // Trip History fetch async
    async function asyncUpTripHistory() {
      await trackAsyncFunction(
        updateTripHistory,
        "updateTripHistory",
        "context-init",
      )();
    }
    asyncUpTripHistory();
  }, [updateTripHistory]);

  const checkPremium = useCallback(async () => {
    const isPremiumNow = await isPremiumMember();
    setIsPremium(isPremiumNow);
    return isPremiumNow;
  }, []);
  useEffect(() => {
    Purchases.addCustomerInfoUpdateListener((info) => {
      // handle any changes to purchaserInfo
      if (typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        // Grant user "premium" access
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
    });
  }, []);

  useEffect(() => {
    async function loadIsPremiumFromAsync() {
      try {
        const uid = await secureStoreGetItem("uid");
        const isPremiumString = await secureStoreGetObject(
          (uid ?? "") + "isPremium",
        );
        if (isPremiumString !== null) {
          const isPremiumNow = safelyParseJSON(isPremiumString);
          setIsPremium(isPremiumNow);
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadIsPremiumFromAsync();
  }, []);

  function _loadCatListFromMMKV() {
    try {
      const categoryList = getMMKVObject(MMKV_KEYS.CATEGORY_LIST);
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
  const fetchOrLoadCatList = useCallback(async (tripid: string) => {
    if (tripid == "async") {
      _loadCatListFromMMKV();
      return;
    }
    try {
      const catList = await trackAsyncFunction(
        fetchCategories,
        "fetchCategories",
        "context-update",
      )(tripid);
      setCatIconNames(catList);
    } catch (error) {
      _loadCatListFromMMKV();
    }
  }, []);

  const setPeriodString = useCallback((periodName: string) => {
    setPeriodName(periodName as RangeString);
  }, []);

  const saveUserNameInStorage = useCallback(async (name: string) => {
    await secureStoreSetItem("userName", name);
  }, []);

  const setUserName = useCallback(
    async (name: string) => {
      if (!name || name?.length < 1) return;
      setName(name);
      await saveUserNameInStorage(name);
    },
    [saveUserNameInStorage],
  );

  const addUserName = useCallback(
    async (userData: UserData) => {
      if (!userData || !userData.userName) {
        return;
      }
      setUserName(userData.userName);
      await saveUserNameInStorage(userData.userName);
    },
    [saveUserNameInStorage, setUserName],
  );

  const setFreshlyCreatedTo = useCallback(async (bool: boolean) => {
    setFreshlyCreated(bool);
    await asyncStoreSetObject("freshlyCreated", bool);
  }, []);

  const deleteUser = useCallback((id: string) => {
    Alert.alert(i18n.t("alertDeleteContextNotImplemented"));
  }, []);
  const loadUserNameFromStorage = useCallback(async () => {
    const _userName = await secureStoreGetItem("userName");
    if (_userName) {
      const trimmedName = _userName.replaceAll('"', "").trim();
      setName(trimmedName);
      if (trimmedName != _userName) await saveUserNameInStorage(trimmedName);
    }
  }, [saveUserNameInStorage]);

  const value = useMemo(
    () => ({
      userName: userName,
      setUserName: setUserName,
      periodName: periodName,
      setPeriodString: setPeriodString,

      lastCurrency: lastCurrency,
      setLastCurrency: setLastCurrency,
      lastCountry: lastCountry,
      setLastCountry: setLastCountry,

      addUserName: addUserName,
      deleteUser: deleteUser,

      freshlyCreated: freshlyCreated,
      setFreshlyCreatedTo: setFreshlyCreatedTo,
      needsTour: needsTour,
      setNeedsTour: setNeedsTour,

      tripHistory: tripHistory,
      setTripHistory: setTripHistory,
      updateTripHistory: updateTripHistory,

      isOnline: isOnline,
      setIsOnline: setIsOnline,
      saveUserNameInStorage: saveUserNameInStorage,
      loadUserNameFromStorage: loadUserNameFromStorage,

      isPremium: isPremium,
      checkPremium: checkPremium,
      loadCatListFromAsyncInCtx: fetchOrLoadCatList,
      catIconNames: catIconNames,
      loadLastCurrencyCountryFromAsync: loadLastCurrencyCountryFromAsync,

      setIsShowingGraph: setIsShowingGraph,
      isShowingGraph: isShowingGraph,
      isSendingOfflineQueueMutex: isSendingOfflineQueueMutex,
      setIsSendingOfflineQueueMutex: setIsSendingOfflineQueueMutex,
      hasNewChanges: hasNewChanges,
      setHasNewChanges: setHasNewChanges,
    }),
    [
      userName,
      setUserName,
      periodName,
      setPeriodString,
      lastCurrency,
      lastCountry,
      addUserName,
      deleteUser,
      freshlyCreated,
      setFreshlyCreatedTo,
      needsTour,
      tripHistory,
      updateTripHistory,
      isOnline,
      isPremium,
      checkPremium,
      fetchOrLoadCatList,
      catIconNames,
      loadLastCurrencyCountryFromAsync,
      isShowingGraph,
      isSendingOfflineQueueMutex,
      hasNewChanges,
      loadUserNameFromStorage,
      saveUserNameInStorage,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;

UserContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
