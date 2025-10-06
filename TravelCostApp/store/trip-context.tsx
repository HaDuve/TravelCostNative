/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useEffect, useState } from "react";

import { useInterval } from "../components/Hooks/useInterval";
import { MAX_JS_NUMBER } from "../confAppConstants";
import { Category } from "../util/category";
import { isConnectionFastEnough } from "../util/connectionSpeed";
import safeLogError from "../util/error";
import { ExpenseData, isPaidString } from "../util/expense";
import { fetchTrip, fetchUser, getTravellers, updateTrip } from "../util/http";
import { TravellerData } from "../util/traveller-utils";

import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";
import { getMMKVObject, setMMKVObject } from "./mmkv";
import { secureStoreGetItem } from "./secure-storage";

// SVG error handling - removed problematic import

export interface TripData {
  tripName?: string;
  expenses?: ExpenseData[];
  totalBudget?: string;
  dailyBudget?: string;
  tripCurrency?: string;
  travellers?: TravellerData;
  tripid?: string;
  totalSum?: number;
  tripProgress?: number;
  startDate?: string;
  endDate?: string;
  isPaidDate?: string;
  isPaid?: isPaidString;
  isDynamicDailyBudget?: boolean;
  // online categories are stored as a JSON.stringified strings
  // local categories are stored as Category arrays.
  categories?: Category[] | string;
}

export type TripContextType = {
  tripid: string;
  tripName: string;
  totalBudget: string;
  dailyBudget: string;
  setdailyBudget: (dailyBudget: string) => void;
  tripCurrency: string;
  totalSum: number;
  tripProgress: number;
  startDate: string;
  endDate: string;
  refreshState: boolean;
  refresh: () => void;
  setTripProgress: (percent: number) => void;
  travellers: TravellerData;
  fetchAndSetTravellers: (tripid: string) => Promise<void>;
  setTotalSum: (amount: number) => void;
  setTripid: (tripid: string) => void;
  addTrip: ({ tripName, tripTotalBudget }) => void;
  deleteTrip: (tripid: string) => void;
  getcurrentTrip: () => TripData;
  setCurrentTrip: (tripid: string, trip: TripData) => Promise<void>;
  fetchAndSetCurrentTrip: (tripid: string) => Promise<TripData>;
  saveTripDataInStorage: (tripData: TripData) => Promise<void>;
  loadTripDataFromStorage: () => Promise<TripData>;
  saveTravellersInStorage: (travellers) => Promise<void>;
  loadTravellersFromStorage: () => Promise<void>;
  fetchAndSettleCurrentTrip: (unSettle?: boolean) => Promise<void>;
  isPaid: isPaidString;
  isPaidDate: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isDynamicDailyBudget: boolean;
};

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
  travellers: [] as TravellerData,
  fetchAndSetTravellers: async (tripid: string) => {},
  setTotalSum: (amount: number) => {},
  setTripid: (tripid: string) => {},

  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid: string) => {},
  getcurrentTrip: () => {
    const tripData = {} as TripData;
    return tripData;
  },
  setCurrentTrip: async (tripid: string, trip: TripData) => {},
  fetchAndSetCurrentTrip: async (tripid: string): Promise<TripData> => {
    return {};
  },
  saveTripDataInStorage: async (tripData: TripData) => {},
  loadTripDataFromStorage: async (): Promise<TripData> => ({}) as TripData,
  saveTravellersInStorage: async travellers => {},
  loadTravellersFromStorage: async () => {},
  fetchAndSettleCurrentTrip: async (unSettle = false) => {},
  isPaid: isPaidString.notPaid,
  isPaidDate: "",
  isLoading: false,
  setIsLoading: (isLoading: boolean) => {},
  isDynamicDailyBudget: false,
});

function TripContextProvider({ children }) {
  const [travellers, setTravellers] = useState<TravellerData>([]);
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
        // console.log("loadTripidFetchTrip ~ error", error);
        setIsLoading(false);
      }
    } else {
      // console.log("loading from storage in offline mode~");
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
    // Only fetch travellers if we have a tripid and no travellers yet
    if (tripid && (!travellers || travellers.length === 0)) {
      fetchAndSetTravellers(tripid);
    }
  }, [tripid]); // Remove travellers from dependencies to prevent infinite loops

  function setTripProgress(percent: number) {
    if (percent < 0 || percent > 1) percent = 1;
    setProgress(percent);
  }
  //
  function refresh() {
    setRefreshState(!refreshState);
  }

  async function fetchAndSetTravellers(tripid: string) {
    const { isFastEnough } = await isConnectionFastEnough();
    if (!isFastEnough) {
      await loadTravellersFromStorage();
      return;
    }
    if (!tripid || tripid === "") {
      return;
    }
    // updates the current Travellers in context
    try {
      const travellers = await getTravellers(tripid);
      if (travellers?.length < 1) throw new Error("no travellers found");
      saveTravellersInStorage(travellers);
      setTravellers(travellers);
    } catch (error) {
      safeLogError(error);
      throw new Error("no travellers found");
    }
  }

  async function setCurrentTrip(tripid: string, trip: TripData) {
    if (!trip) return;
    if (tripid === "reset") {
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
    // Store travellers in their original format for consistent handling
    setTravellers(trip.travellers);
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
      safeLogError(error);
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
      safeLogError(error);
    }
  }

  function getcurrentTrip() {
    const curTripData: TripData = {
      tripid,
      tripName,
      totalBudget,
      dailyBudget,
      tripCurrency,
      totalSum,
      isPaid,
      isPaidDate,
      tripProgress: progress,
      startDate,
      endDate,
      travellers,
      isDynamicDailyBudget,
    };
    return curTripData;
  }

  function _setTripid(tripid: string) {
    setTripid(tripid);
  }

  function addTrip() {
    // console.log("add Trip NOT IMPLEMENTED");
  }
  function deleteTrip() {
    // console.log("delete Trip NOT IMPLEMENTED");
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
        // console.log("error loading travellers from storage:", error.message);
      }
      setIsLoading(false);

      return tripData;
    } else {
      // console.log("no tripdata loaded from Storage!");
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
    tripid,
    tripName,
    totalBudget,
    dailyBudget,
    setdailyBudget,
    tripCurrency,
    totalSum,
    tripProgress: progress,
    startDate,
    endDate,
    refresh,
    refreshState,
    setTripProgress,
    travellers,
    fetchAndSetTravellers,
    setTotalSum,
    setTripid: _setTripid,
    addTrip,
    deleteTrip,
    getcurrentTrip,
    setCurrentTrip,
    fetchAndSetCurrentTrip,
    saveTripDataInStorage,
    loadTripDataFromStorage,
    saveTravellersInStorage,
    loadTravellersFromStorage,
    fetchAndSettleCurrentTrip,
    isPaid,
    isPaidDate,
    isLoading,
    setIsLoading,
    isDynamicDailyBudget,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
