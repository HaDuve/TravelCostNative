import { createContext, useReducer, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchTrip } from "../util/http";

export const TripContext = createContext({
  tripid: "",
  tripName: "",
  totalBudget: "",
  dailyBudget: "",
  tripCurrency: "",
  totalSum: "",
  // save user as obj with (tname, tid)
  travellers: [],
  setCurrentTravellers: (tripid) => {},

  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid) => {},
  updateTrip: ({ tripid, tripName, tripTotalBudget }) => {},
  getcurrentTrip: () => {},
  setCurrentTrip: ({
    tripName,
    totalBudget,
    tripCurrency,
    dailyBudget,
    travellers,
  }) => {},
  deleteCurrentTrip: (uid) => {},
  getCurrentTripFromStorage: () => {},
  fetchCurrentTrip: (tripid) => {},
  getcurrentTrip: () => {},
});

function TripContextProvider({ children }) {
  const [travellers, setTravellers] = useState([]);

  const [tripid, setTripid] = useState("");
  const [tripName, setTripName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [tripCurrency, setTripCurrency] = useState("");
  const [dailyBudget, setdailyBudget] = useState("");
  const [totalSum, setTotalSumTrip] = useState("");

  async function setCurrentTravellers(tripid) {
    try {
      //TODO finish this function
      const trip = await fetchTrip(tripid);
      if (!trip) return;
    } catch (error) {
      console.log(error);
    }
  }

  function setCurrentTrip(tripid, trip) {
    console.log("setCurrentTrip ~ trip", trip);
    setTripid(tripid);
    setTripName(trip.tripName);
    setTotalBudget(trip.totalBudget.toString());
    setTripCurrency(trip.tripCurrency);
    setdailyBudget(trip.dailyBudget.toString());
    setTravellers(trip.travellers);
    AsyncStorage.setItem("currentTripId", tripid);
    AsyncStorage.setItem("currentTripName", trip.tripName);
    AsyncStorage.setItem("currentTripTotalBudget", trip.totalBudget.toString());
    AsyncStorage.setItem("currentTripCurrency", trip.tripCurrency);
    AsyncStorage.setItem("currentTripDailyBudget", trip.dailyBudget.toString());
    AsyncStorage.setItem("currentTripTravellers", trip.travellers?.toString());
  }

  function setTotalSum(amount) {
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

  function deleteCurrentTrip(id) {
    Alert.alert("delete context not implemented");
  }

  async function fetchCurrentTrip(tripid) {
    try {
      const trip = await fetchTrip(tripid);
      setCurrentTrip(tripid, trip);
    } catch (error) {
      console.log(error);
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

  const value = {
    tripid: tripid,
    tripName: tripName,
    totalBudget: totalBudget,
    tripCurrency: tripCurrency,
    dailyBudget: dailyBudget,
    travellers: travellers,
    totalSum: totalSum,
    getcurrentTrip: getcurrentTrip,
    setCurrentTravellers: setCurrentTravellers,
    setCurrentTrip: setCurrentTrip,
    getCurrentTripFromStorage: getCurrentTripFromStorage,
    fetchCurrentTrip: fetchCurrentTrip,

    setTotalSum: setTotalSum,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
