import { createContext, useReducer, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchTrip, getTravellers } from "../util/http";
import { de } from "../i18n/supportedLanguages";

export const TripContext = createContext({
  tripid: "",
  tripName: "",
  totalBudget: "",
  dailyBudget: "",
  tripCurrency: "",
  totalSum: 0,
  tripProgress: 0,
  setTripProgress: (percent: number) => {},
  // save user as obj with (tname, tid)
  travellers: [],
  setCurrentTravellers: (tripid: string) => {},
  setTotalSum: (amount: number) => {},

  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid: string) => {},
  getcurrentTrip: () => {},
  setCurrentTrip: (tripid: string, trip) => {},
  deleteCurrentTrip: (uid: string) => {},
  getCurrentTripFromStorage: () => {},
  fetchAndSetCurrentTrip: (tripid: string) => {},
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

  function setTripProgress(percent: number) {
    if (percent < 0 || percent > 1) percent = 1;
    setProgress(percent);
  }

  async function setCurrentTravellers(tripid: string) {
    // updates the current Travellers in context
    try {
      const travellers = await getTravellers(tripid);
      setTravellers(travellers);
      return true;
    } catch (error) {
      console.log("setCurrentTravellers ~ error", error);
      return false;
    }
  }

  function setCurrentTrip(tripid: string, trip) {
    console.log("setCurrentTrip ~ trip", trip);
    console.log("setCurrentTrip ~ tripid", tripid);
    // TODO: write trip interface for TypeScript
    setTripid(tripid);
    setTripName(trip.tripName);
    setTotalBudget(trip.totalBudget.toString());
    setTripCurrency(trip.tripCurrency);
    setdailyBudget(trip.dailyBudget.toString());
    setCurrentTravellers(tripid);
    AsyncStorage.setItem("currentTripId", tripid);
    AsyncStorage.setItem("currentTripName", trip.tripName);
    AsyncStorage.setItem("currentTripTotalBudget", trip.totalBudget.toString());
    AsyncStorage.setItem("currentTripCurrency", trip.tripCurrency);
    AsyncStorage.setItem("currentTripDailyBudget", trip.dailyBudget.toString());
    AsyncStorage.setItem("currentTripTravellers", trip.travellers?.toString());
  }

  function setTotalSum(amount: number) {
    setTotalSumTrip(amount);
  }

  async function getCurrentTripFromStorage() {
    const id = await AsyncStorage.getItem("currentTripId");
    const name = await AsyncStorage.getItem("currentTripName");
    const budget = await AsyncStorage.getItem("currentTripTotalBudget");

    if (id) {
      setTripid(id);
      setTripName(name);
      setTotalBudget(budget);
    } else console.error("no trip stored in memory");
  }

  function deleteCurrentTrip(id: string) {
    Alert.alert("deleteCurrentTrip not implemented");
  }

  async function fetchAndSetCurrentTrip(tripid: string) {
    try {
      const trip = await fetchTrip(tripid);
      setCurrentTrip(tripid, trip);
    } catch (error) {
      console.log("error while fetchCurrent Trip in trip-context");
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
    };
    return curTripData;
  }

  function addTrip() {
    console.log("add Trip NOT IMPLEMENTED");
  }
  function deleteTrip() {
    console.log("delete Trip NOT IMPLEMENTED");
  }
  const value = {
    tripid: tripid,
    tripName: tripName,
    totalBudget: totalBudget,
    dailyBudget: dailyBudget,
    tripCurrency: tripCurrency,
    totalSum: totalSum,
    tripProgress: progress,
    setTripProgress: setTripProgress,
    travellers: travellers,
    setCurrentTravellers: setCurrentTravellers,
    setTotalSum: setTotalSum,
    addTrip: addTrip,
    deleteTrip: deleteTrip,
    getcurrentTrip: getcurrentTrip,
    setCurrentTrip: setCurrentTrip,
    deleteCurrentTrip: deleteCurrentTrip,
    getCurrentTripFromStorage: getCurrentTripFromStorage,
    fetchAndSetCurrentTrip: fetchAndSetCurrentTrip,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
