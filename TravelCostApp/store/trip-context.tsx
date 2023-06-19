/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { fetchTrip, getTravellers, updateTrip } from "../util/http";
import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";
import Toast from "react-native-toast-message";
import { MAX_JS_NUMBER } from "../confAppConstants";
import { secureStoreGetItem } from "./secure-storage";
import { ExpenseData, isPaidString } from "../util/expense";
import { err } from "react-native-svg/lib/typescript/xml";

export interface TripData {
  tripName: string;
  expenses: ExpenseData[];
  totalBudget: string;
  dailyBudget: string;
  tripCurrency: string;
  travellers: object;
  tripid?: string;
  totalSum?: number;
  tripProgress?: number;
  startDate?: string;
  endDate?: string;
  isPaidDate?: string;
  isPaid?: isPaidString;
}

export const TripContext = createContext({
  tripid: "",
  tripName: "",
  totalBudget: "",
  dailyBudget: "",
  tripCurrency: "",
  totalSum: 0,
  tripProgress: 0,
  startDate: "",
  endDate: "",
  refreshState: false,
  refresh: () => {},
  setTripProgress: (percent: number) => {},
  travellers: [],
  setCurrentTravellers: async (tripid: string) => {},
  setTotalSum: (amount: number) => {},
  setTripid: (tripid: string) => {},

  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid: string) => {},
  getcurrentTrip: () => {},
  setCurrentTrip: async (tripid: string, trip) => {},
  fetchAndSetCurrentTrip: async (tripid: string) => {},
  saveTripDataInStorage: async (tripData) => {},
  loadTripDataFromStorage: async () => {},
  saveTravellersInStorage: async (travellers) => {},
  loadTravellersFromStorage: async () => {},
  fetchAndSettleCurrentTrip: async (unSettle = false) => {},
  isPaid: isPaidString.notPaid,
  isPaidDate: "",
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

  useEffect(() => {
    // set tripid from storage
    async function loadTripidFromStorage() {
      console.log("loadTripidFromStorage ~ loadTripidFromStorage");
      const loadedTripid = await secureStoreGetItem("currentTripid");
      if (loadedTripid) {
        setTripid(loadedTripid);
        fetchAndSetCurrentTrip(loadedTripid);
      }
    }
    loadTripidFromStorage();
  }, []);

  function setTripProgress(percent: number) {
    if (percent < 0 || percent > 1) percent = 1;
    setProgress(percent);
  }

  function refresh() {
    console.log("refresh ~ refresh", refresh);
    setRefreshState(!refreshState);
  }

  async function setCurrentTravellers(tripid: string) {
    if (tripid === "") {
      setTravellers([]);
      return;
    }
    // updates the current Travellers in context
    try {
      const travellers = await getTravellers(tripid);
      saveTravellersInStorage(travellers);
      setTravellers(travellers);
      return true;
    } catch (error) {
      // console.log("setCurrentTravellers ~ error", error);
      return false;
    }
  }

  async function setCurrentTrip(tripid: string, trip) {
    if (!trip) return;
    console.log("setCurrentTrip ~ setCurrentTrip", tripid);
    if (tripid === "reset") {
      console.log("resetting Trip to empty!");
      _setTripid("");
      setTripName("");
      setTotalBudget("");
      setTripCurrency("");
      setdailyBudget("");
      setCurrentTravellers("");
      setStartDate("");
      setEndDate("");
      return;
    }
    // console.log("setCurrentTrip ~ trip", trip);
    // console.log("setCurrentTrip ~ tripid", tripid);
    _setTripid(tripid);
    setTripName(trip.tripName);
    setTotalBudget(
      trip.totalBudget ? trip.totalBudget.toString() : MAX_JS_NUMBER.toString()
    );
    setTripCurrency(trip.tripCurrency);
    setdailyBudget(trip.dailyBudget.toString());
    setCurrentTravellers(tripid);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    console.log("trip.isPaid:", trip.isPaid);
    setIsPaid(trip.isPaid);
    setIsPaidDate(trip.isPaidDate);
    try {
      await updateTrip(tripid, trip);
    } catch (error) {
      console.log(error);
    }
  }

  function setTotalSum(amount: number) {
    setTotalSumTrip(amount);
  }

  async function fetchAndSetCurrentTrip(tripid: string) {
    try {
      const trip = await fetchTrip(tripid);
      trip.tripid = tripid;
      await setCurrentTrip(tripid, trip);
      await saveTripDataInStorage(trip);
      return trip;
    } catch (error) {
      console.warn(
        "error while fetchCurrent Trip in trip-context searching for ",
        tripid
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
      return trip;
    } catch (error) {
      console.warn(
        "error while fetchCurrent Trip in trip-context searching for ",
        tripid
      );
    }
  }

  function getcurrentTrip() {
    const curTripData = {
      tripid: tripid,
      tripName: tripName,
      totalBudget: totalBudget,
      dailyBudget: dailyBudget,
      tripCurrency: tripCurrency,
      totalSum: totalSum,
      isPaid: isPaid,
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

  async function saveTripDataInStorage(trip: TripData) {
    // cut away the trip.expenses
    const tripData = trip;
    delete tripData.expenses;
    await asyncStoreSetObject("currentTrip", trip);
  }

  async function loadTripDataFromStorage() {
    const tripData = await asyncStoreGetObject("currentTrip");
    if (tripData) {
      _setTripid(tripData.tripid);
      setTripName(tripData.tripName);
      setTotalBudget(
        tripData.totalBudget
          ? tripData.totalBudget.toString()
          : MAX_JS_NUMBER.toString()
      );
      setTripCurrency(tripData.tripCurrency);
      setdailyBudget(tripData.dailyBudget.toString());
      await loadTravellersFromStorage();
      return tripData;
    } else {
      console.warn("no tripdata loaded from Storage!");
    }
  }

  async function saveTravellersInStorage(travellers) {
    await asyncStoreSetObject("currentTravellers", travellers);
  }

  async function loadTravellersFromStorage() {
    await asyncStoreGetObject("currentTravellers").then((travellers) => {
      if (travellers) {
        const travellerList = [];
        // travellers.forEach((traveller) => {
        //   console.log("awaitasyncStoreGetObject ~ traveller:", traveller);
        //   setTravellers(["test"]);
        // });
        setTravellers(travellers);
      }
    });
  }

  const value = {
    tripid: tripid,
    tripName: tripName,
    totalBudget: totalBudget,
    dailyBudget: dailyBudget,
    tripCurrency: tripCurrency,
    totalSum: totalSum,
    tripProgress: progress,
    startDate: startDate,
    endDate: endDate,
    refresh: refresh,
    refreshState: refreshState,
    setTripProgress: setTripProgress,
    travellers: travellers,
    setCurrentTravellers: setCurrentTravellers,
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
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
