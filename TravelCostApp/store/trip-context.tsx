/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  fetchTrip,
  fetchUser,
  getTravellers,
  updateTrip,
  removeTravelerFromTrip,
  softDeleteTrip as softDeleteTripAPI,
  fetchAllUserTrips,
} from "../util/http";
import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";
import Toast from "react-native-toast-message";
import { MAX_JS_NUMBER } from "../confAppConstants";
import { secureStoreGetItem, secureStoreSetItem } from "./secure-storage";
import { ExpenseData, isPaidString } from "../util/expense";
// import { err } from "react-native-svg/lib/typescript/xml";
import { Traveller } from "../util/traveler";
import { isConnectionFastEnough } from "../util/connectionSpeed";
import { useInterval } from "../components/Hooks/useInterval";
import { setMMKVObject, getMMKVObject, deleteMMKVObject } from "./mmkv";
import set from "react-native-reanimated";
import { Category } from "../util/category";
import safeLogError from "../util/error";
import { UserContext } from "./user-context";
import PropTypes from "prop-types";

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
  // online categories are stored as a JSON.stringified strings
  // local categories are stored as Category arrays.
  categories?: Category[] | string;
  // Soft delete flags
  deleted?: boolean;
  deletedTimestamp?: number;
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
  travellers: Traveller[];
  fetchAndSetTravellers: (tripid: string) => Promise<boolean>;
  setTotalSum: (amount: number) => void;
  setTripid: (tripid: string) => void;
  addTrip: ({ tripName, tripTotalBudget }) => void;
  deleteTrip: (tripid: string) => void;
  leaveTrip: (tripid: string) => Promise<void>;
  softDeleteTrip: (tripid: string) => Promise<void>;
  leaveOrDeleteTrip: (tripid: string) => Promise<void>;
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

export const TripContext = createContext<TripContextType>({
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
  fetchAndSetTravellers: async (tripid: string) => {
    return false;
  },
  setTotalSum: (amount: number) => {},
  setTripid: (tripid: string) => {},

  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid: string) => {},
  leaveTrip: async (tripid: string) => {},
  softDeleteTrip: async (tripid: string) => {},
  leaveOrDeleteTrip: async (tripid: string) => {},
  getcurrentTrip: () => {
    const tripData = {} as TripData;
    return tripData;
  },
  setCurrentTrip: async (tripid: string, trip: TripData) => {},
  fetchAndSetCurrentTrip: async (tripid: string): Promise<TripData> => {
    return {};
  },
  saveTripDataInStorage: async (tripData: TripData) => {},
  loadTripDataFromStorage: async () => {
    return {} as TripData;
  },
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
  const userCtx = React.useContext(UserContext);
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
    console.log("loadTripidFetchTrip ~ stored_tripid:", stored_tripid);
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
    if (!travellers || (travellers?.length === 0 && tripid)) {
      fetchAndSetTravellers(tripid);
    }
  }, [travellers, tripid]);

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
      // setTravellers([]);
      return false;
    }
    // updates the current Travellers in context
    try {
      const travellers = await getTravellers(tripid);
      if (travellers?.length < 1) throw new Error("no travellers found");
      saveTravellersInStorage(travellers);
      setTravellers(travellers);
      return true;
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
    setTripid(tripid);
  }

  function addTrip() {
    // console.log("add Trip NOT IMPLEMENTED");
  }
  function deleteTrip(tripid: string) {
    // Use the new leaveOrDeleteTrip function
    leaveOrDeleteTrip(tripid);
  }

  async function leaveTrip(tripidToLeave: string) {
    try {
      const uid = await secureStoreGetItem("uid");
      if (!uid) {
        throw new Error("User not authenticated");
      }

      // Remove user from trip travellers
      await removeTravelerFromTrip(tripidToLeave, uid);

      // If this was the current active trip, handle active trip reassignment
      if (tripidToLeave === tripid) {
        await handleActiveTripChange(uid);
      }

      // Update trip history to remove this trip
      const updatedTripHistory = userCtx.tripHistory.filter(
        (id) => id !== tripidToLeave
      );
      userCtx.setTripHistory(updatedTripHistory);

      // Only refresh from server if not becoming freshly created
      if (updatedTripHistory.length > 0) {
        await userCtx.updateTripHistory();
      }

      Toast.show({
        type: "success",
        text1: "Left Trip",
        text2: "You have successfully left the trip",
      });
    } catch (error) {
      safeLogError(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to leave trip",
      });
    }
  }

  async function softDeleteTrip(tripidToDelete: string) {
    try {
      const uid = await secureStoreGetItem("uid");
      if (!uid) {
        throw new Error("User not authenticated");
      }

      // Soft delete the trip
      await softDeleteTripAPI(tripidToDelete);

      // Clear cached trip data to prevent stale data from showing
      const { deleteMMKVObject } = await import("./mmkv");
      deleteMMKVObject("trip_" + tripidToDelete);
      deleteMMKVObject("lastUpdateISO_trip_" + tripidToDelete);
      deleteMMKVObject("tripHistoryItem_" + tripidToDelete);

      // If this was the current active trip, handle active trip reassignment
      if (tripidToDelete === tripid) {
        await handleActiveTripChange(uid);
      }

      // Update trip history to remove this trip
      const updatedTripHistory = userCtx.tripHistory.filter(
        (id) => id !== tripidToDelete
      );
      userCtx.setTripHistory(updatedTripHistory);

      // Only refresh from server if not becoming freshly created
      if (updatedTripHistory.length > 0) {
        await userCtx.updateTripHistory();
      }

      Toast.show({
        type: "success",
        text1: "Trip Deleted",
        text2: "Trip has been successfully deleted",
      });
    } catch (error) {
      safeLogError(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete trip",
      });
    }
  }

  async function leaveOrDeleteTrip(tripidToProcess: string) {
    try {
      const uid = await secureStoreGetItem("uid");
      if (!uid) {
        throw new Error("User not authenticated");
      }

      // Get current trip data to check travellers
      const tripData = await fetchTrip(tripidToProcess);
      if (!tripData) {
        throw new Error("Trip not found");
      }

      // Get all travellers for this trip
      const travellers = await getTravellers(tripidToProcess);

      // If only one traveller (the current user), soft delete the trip
      if (travellers.length <= 1) {
        await softDeleteTrip(tripidToProcess);
      } else {
        // Multiple travellers, just leave the trip
        await leaveTrip(tripidToProcess);
      }
    } catch (error) {
      safeLogError(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to process trip",
      });
    }
  }

  async function handleActiveTripChange(uid: string) {
    try {
      // Get all user trips (excluding deleted ones)
      const allTrips = await fetchAllUserTrips(uid);

      if (allTrips.length === 0) {
        // No other trips - reset to fresh user state
        await setCurrentTrip("reset", null);
        await secureStoreSetItem("currentTripId", "");
        userCtx.setFreshlyCreatedTo(true);
        return;
      }

      // If user has other trips, ask which one to set as active
      // For now, we'll automatically select the first available trip
      // In a real implementation, you might want to show a selection dialog
      const newActiveTrip = allTrips[0];

      // Set the new active trip
      await setCurrentTrip(newActiveTrip.tripid, newActiveTrip);
      await secureStoreSetItem("currentTripId", newActiveTrip.tripid);

      // Update user's current trip
      const { updateUser } = await import("../util/http");
      await updateUser(uid, {
        currentTrip: newActiveTrip.tripid,
      });

      // Refresh travellers for the new active trip
      await fetchAndSetTravellers(newActiveTrip.tripid);
    } catch (error) {
      safeLogError(error);
      // If all else fails, reset to fresh user state
      await setCurrentTrip("reset", null);
      await secureStoreSetItem("currentTripId", "");
      userCtx.setFreshlyCreatedTo(true);
    }
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
    leaveTrip: leaveTrip,
    softDeleteTrip: softDeleteTrip,
    leaveOrDeleteTrip: leaveOrDeleteTrip,
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

TripContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
