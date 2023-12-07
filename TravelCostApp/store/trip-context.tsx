/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { fetchTrip, fetchUser, getTravellers, updateTrip } from "../util/http";
import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";
import Toast from "react-native-toast-message";
import { MAX_JS_NUMBER } from "../confAppConstants";
import { secureStoreGetItem } from "./secure-storage";
import { ExpenseData, isPaidString } from "../util/expense";
import { err } from "react-native-svg/lib/typescript/xml";
import { Traveller } from "../util/traveler";
import { isConnectionFastEnough } from "../util/connectionSpeed";
import { useInterval } from "../components/Hooks/useInterval";
import { setMMKVObject, getMMKVObject } from "./mmkv";
import set from "react-native-reanimated";

export interface TripData {
  tripName?: string;
  expenses?: ExpenseData[];
  totalBudget?: string;
  dailyBudget?: string;
  tripCurrency?: string;
  travellers?: Traveller[];
  tripid?: string;
  totalSum?: number;
  tripProgress?: number;
  startDate?: string;
  endDate?: string;
  isPaidDate?: string;
  isPaid?: isPaidString;
  isDynamicDailyBudget?: boolean;
}

export const TripContext = createContext({
  tripid: "",
  tripName: "",
  totalBudget: "",
  dailyBudget: "",
  setdailyBudget: (dailyBudget: string) => {},
  tripCurrency: "",
  totalSum: 0,
  tripProgress: 0,
  startDate: "",
  endDate: "",
  refreshState: false,
  refresh: () => {},
  setTripProgress: (percent: number) => {},
  travellers: [],
  fetchAndSetTravellers: async (tripid: string) => {},
  setTotalSum: (amount: number) => {},
  setTripid: (tripid: string) => {},

  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid: string) => {},
  getcurrentTrip: () => {},
  setCurrentTrip: async (tripid: string, trip: TripData) => {},
  fetchAndSetCurrentTrip: async (tripid: string): Promise<TripData> => {
    return {};
  },
  saveTripDataInStorage: async (tripData: TripData) => {},
  loadTripDataFromStorage: async () => {},
  saveTravellersInStorage: async (travellers) => {},
  loadTravellersFromStorage: async () => {},
  fetchAndSettleCurrentTrip: async (unSettle = false) => {},
  isPaid: isPaidString.notPaid,
  isPaidDate: "",
  isLoading: false,
  setIsLoading: (isLoading: boolean) => {},
  isDynamicDailyBudget: false,
});

function TripContextProvider({ children }) {
  const [travellers, setTravellers] = useState([]);
  const [tripid, setTripid] = useState("");
  const [tripName, setTripName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [tripCurrency, setTripCurrency] = useState("");
  const [dailyBudget, setdailyBudget] = useState("");
  const [totalSum, setTotalSumTrip] = useState(0);
  const [progress, setProgress] = useState(0);
  const [refreshState, setRefreshState] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPaid, setIsPaid] = useState(isPaidString.notPaid);
  const [isPaidDate, setIsPaidDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDynamicDailyBudget, setIsDynamicDailyBudget] = useState(false);

  async function loadTripidFetchTrip() {
    const stored_tripid = await secureStoreGetItem("currentTripId");
    const stored_uid = await secureStoreGetItem("uid");
    if (!(stored_tripid || stored_uid)) return;
    setTripid(stored_tripid ?? "");
    const { isFastEnough } = await isConnectionFastEnough();
    if (isFastEnough) {
      try {
        const checkUser = await fetchUser(stored_uid);
        const fetched_tripid = checkUser.currentTrip;
        await fetchAndSetCurrentTrip(fetched_tripid ?? stored_tripid);
        await fetchAndSetTravellers(fetched_tripid ?? stored_tripid);
      } catch (error) {
        console.log("loadTripidFetchTrip ~ error", error);
        setIsLoading(false);
      }
    } else {
      console.log("loading from storage in offline mode~");
      await loadTripDataFromStorage();
      setIsLoading(false);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    function calcDynamicDailyBudget() {
      if (isDynamicDailyBudget) {
        const daysLeft = Math.floor(
          (new Date(endDate).getTime() - new Date().getTime()) /
            (1000 * 3600 * 24)
        );
        const totalBudgetLeft = Number(totalBudget) - Number(totalSum);
        const dailyBudget = totalBudgetLeft / daysLeft;
        // negative numbers are not allowed
        if (isNaN(dailyBudget)) return;
        if (dailyBudget < 0) {
          setdailyBudget("0.0001");
        } else {
          setdailyBudget(dailyBudget.toFixed(2));
        }
      }
    }
    calcDynamicDailyBudget();
  }, [isDynamicDailyBudget, totalBudget, totalSum, endDate]);

  useInterval(
    () => {
      if (tripid && tripName) {
        setIsLoading(false);
        return;
      }
      if (isLoading) return;
      setIsLoading(true);
      loadTripidFetchTrip();
    },
    2000,
    true
  );

  useEffect(() => {
    async function loadAsyncTravellers() {
      const travellers = await asyncStoreGetObject("currentTravellers");
      if (travellers) {
        setTravellers(travellers);
      }
    }
    loadAsyncTravellers();
  }, []);

  useEffect(() => {
    if (!travellers || (travellers?.length === 0 && tripid)) {
      console.log("fetching travellers");
      fetchAndSetTravellers(tripid);
    }
  }, [travellers, tripid]);

  function setTripProgress(percent: number) {
    if (percent < 0 || percent > 1) percent = 1;
    setProgress(percent);
  }
  //
  function refresh() {
    console.log("refresh ~ refresh", refresh);
    setRefreshState(!refreshState);
  }

  async function fetchAndSetTravellers(tripid: string) {
    const { isFastEnough } = await isConnectionFastEnough();
    if (!isFastEnough) {
      await loadTravellersFromStorage();
      return;
    }
    if (!tripid || tripid === "") {
      // setTravellers([]);
      return false;
    }
    // updates the current Travellers in context
    try {
      const travellers = await getTravellers(tripid);
      console.log("fetchAndSetTravellers ~ travellers:", travellers);
      if (travellers?.length < 1) throw new Error("no travellers found");
      saveTravellersInStorage(travellers);
      setTravellers(travellers);
      return true;
    } catch (error) {
      // console.log("setCurrentTravellers ~ error", error);
      throw new Error("no travellers found");
    }
  }

  async function setCurrentTrip(tripid: string, trip: TripData) {
    if (!trip) return;
    if (tripid === "reset") {
      console.log("resetting Trip to empty!");
      _setTripid("");
      setTripName("");
      setTotalBudget("");
      setTripCurrency("");
      setdailyBudget("");
      setTravellers([]);
      setStartDate("");
      setEndDate("");
      setIsPaid(isPaidString.notPaid);
      setIsPaidDate("");
      setTotalSumTrip(0);
      setIsLoading(false);
      return;
    }
    _setTripid(tripid);
    setTripName(trip.tripName);
    setTotalBudget(
      trip.totalBudget ? trip.totalBudget.toString() : MAX_JS_NUMBER.toString()
    );
    setTripCurrency(trip.tripCurrency);
    // negative Numbers are not allowed
    if (Number(trip.dailyBudget) < 0) {
      setdailyBudget("0.0001");
    } else {
      setdailyBudget(trip.dailyBudget.toString());
    }
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setIsPaid(trip.isPaid);
    setIsPaidDate(trip.isPaidDate);
    setTotalSumTrip(trip.totalSum);
    setIsLoading(false);
    setIsDynamicDailyBudget(trip.isDynamicDailyBudget);
    if (typeof trip.travellers[1] === "string") {
      setTravellers(trip.travellers);
    } else {
      const extractedTravellers = [];
      Object.keys(trip.travellers).forEach((key) => {
        //skip undefined keys
        if (key && travellers[key]) {
          extractedTravellers.push(travellers[key]["userName"]);
        }
      });
      setTravellers(extractedTravellers);
    }
  }

  function setTotalSum(amount: number) {
    setTotalSumTrip(amount);
  }

  async function fetchAndSetCurrentTrip(tripid: string) {
    if (!tripid) return;
    const { isFastEnough } = await isConnectionFastEnough();
    if (!isFastEnough) return;
    try {
      const trip: TripData = await fetchTrip(tripid);
      if (!trip) throw new Error("no trip found");
      trip.tripid = tripid;
      await setCurrentTrip(tripid, trip);
      await saveTripDataInStorage(trip);
      return trip;
    } catch (error) {
      console.warn(
        "error while fetchCurrent Trip in trip-context searching for ",
        tripid,
        error.message
      );
    }
  }

  async function fetchAndSettleCurrentTrip(unSettle = false) {
    try {
      const trip = await fetchTrip(tripid);
      trip.isPaid = isPaidString.paid;
      const today = new Date();
      trip.isPaidDate = today.toISOString();
      if (unSettle) {
        trip.isPaid = isPaidString.notPaid;
        trip.isPaidDate = "";
      }
      await setCurrentTrip(tripid, trip);
      await saveTripDataInStorage(trip);
      await updateTrip(tripid, trip);
    } catch (error) {
      console.warn(
        "error while fetchCurrent Trip in trip-context searching for ",
        tripid
      );
    }
  }

  function getcurrentTrip() {
    const curTripData: TripData = {
      tripid: tripid,
      tripName: tripName,
      totalBudget: totalBudget,
      dailyBudget: dailyBudget,
      tripCurrency: tripCurrency,
      totalSum: totalSum,
      isPaid: isPaid,
      isPaidDate: isPaidDate,
      tripProgress: progress,
      startDate: startDate,
      endDate: endDate,
      travellers: travellers,
      isDynamicDailyBudget: isDynamicDailyBudget,
    };
    return curTripData;
  }

  function _setTripid(tripid: string) {
    // console.log("_setTripid ~ tripid", tripid);
    setTripid(tripid);
  }

  function addTrip() {
    console.log("add Trip NOT IMPLEMENTED");
  }
  function deleteTrip() {
    console.log("delete Trip NOT IMPLEMENTED");
  }

  async function saveTripDataInStorage(tripData: TripData) {
    // cut away the trip.expenses array
    tripData.expenses = [];
    setMMKVObject("currentTrip", tripData);
  }

  async function loadTripDataFromStorage() {
    const tripData: TripData = getMMKVObject("currentTrip");
    if (tripData) {
      setTripName(tripData.tripName);
      setTotalBudget(
        tripData.totalBudget
          ? tripData.totalBudget.toString()
          : MAX_JS_NUMBER.toString()
      );

      setTripCurrency(tripData.tripCurrency);
      setdailyBudget(tripData.dailyBudget.toString());
      try {
        await loadTravellersFromStorage();
      } catch (error) {
        console.log("error loading travellers from storage:", error.message);
      }
      setIsLoading(false);

      return tripData;
    } else {
      console.warn("no tripdata loaded from Storage!");
      setIsLoading(false);
    }
  }

  async function saveTravellersInStorage(travellers) {
    await asyncStoreSetObject("currentTravellers", travellers);
  }

  async function loadTravellersFromStorage() {
    const travellers = await asyncStoreGetObject("currentTravellers");
    if (travellers) {
      setTravellers(travellers);
    }
  }

  const value = {
    tripid: tripid,
    tripName: tripName,
    totalBudget: totalBudget,
    dailyBudget: dailyBudget,
    setdailyBudget: setdailyBudget,
    tripCurrency: tripCurrency,
    totalSum: totalSum,
    tripProgress: progress,
    startDate: startDate,
    endDate: endDate,
    refresh: refresh,
    refreshState: refreshState,
    setTripProgress: setTripProgress,
    travellers: travellers,
    fetchAndSetTravellers: fetchAndSetTravellers,
    setTotalSum: setTotalSum,
    setTripid: _setTripid,
    addTrip: addTrip,
    deleteTrip: deleteTrip,
    getcurrentTrip: getcurrentTrip,
    setCurrentTrip: setCurrentTrip,
    fetchAndSetCurrentTrip: fetchAndSetCurrentTrip,
    saveTripDataInStorage: saveTripDataInStorage,
    loadTripDataFromStorage: loadTripDataFromStorage,
    saveTravellersInStorage: saveTravellersInStorage,
    loadTravellersFromStorage: loadTravellersFromStorage,
    fetchAndSettleCurrentTrip: fetchAndSettleCurrentTrip,
    isPaid: isPaid,
    isPaidDate: isPaidDate,
    isLoading: isLoading,
    setIsLoading: setIsLoading,
    isDynamicDailyBudget: isDynamicDailyBudget,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
