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

  trips: [],
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
});

function tripsReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET":
      const inverted = action.payload.reverse();
      return inverted;
    case "UPDATE":
      const updatableTripIndex = state.findIndex(
        (trip) => trip.tripid === action.payload.tripid
      );
      const updatableTrip = state[updatableTripIndex];
      const updatedItem = { ...updatableTrip, ...action.payload.data };
      const updatedTrips = [...state];
      updatedTrips[updatableTripIndex] = updatedItem;
      return updatedTrips;
    case "DELETE":
      return state.filter((trip) => trip.tripid !== action.payload);
    default:
      return state;
  }
}

function TripContextProvider({ children }) {
  const [tripsState, dispatch] = useReducer(tripsReducer, []);
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

  function addTrip(tripData) {
    dispatch({ type: "ADD", payload: tripData });
  }

  function setTrips(trips) {
    dispatch({ type: "SET", payload: trips });
  }

  function deleteTrip(id) {
    dispatch({ type: "DELETE", payload: id });
  }

  function updateTrip(id, tripData) {
    dispatch({ type: "UPDATE", payload: { id: id, data: tripData } });
  }
  function getcurrentTrip() {
    const tripData = {
      tripid: tripid,
      tripName: tripName,
      totalBudget: totalBudget,
      dailyBudget: dailyBudget,
      tripCurrency: tripCurrency,
      totalSum: totalSum,
      travellers: travellers,
    };
    return tripData;
  }
  function setCurrentTrip(tripid, trip) {
    console.log("setCurrentTrip ~ trip", trip);
    setTripid(tripid);
    setTripName(trip.tripName);
    setTotalBudget(trip.totalBudget.toString());
    setTripCurrency(trip.tripCurrency);
    setdailyBudget(trip.dailyBudget.toString());
    setCurrentTravellers(trip.travellers);
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

  const value = {
    tripid: tripid,
    tripName: tripName,
    totalBudget: totalBudget,
    tripCurrency: tripCurrency,
    dailyBudget: dailyBudget,
    travellers: travellers,
    totalSum: totalSum,
    setCurrentTravellers: setCurrentTravellers,

    getcurrentTrip: getcurrentTrip,
    setCurrentTrip: setCurrentTrip,
    deleteCurrentTrip: deleteCurrentTrip,
    getCurrentTripFromStorage: getCurrentTripFromStorage,
    fetchCurrentTrip: fetchCurrentTrip,

    addTrip: addTrip,
    setTrips: setTrips,
    deleteTrip: deleteTrip,
    updateTrip: updateTrip,
    setTotalSum: setTotalSum,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
