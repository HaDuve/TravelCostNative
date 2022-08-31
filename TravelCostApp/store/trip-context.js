import { createContext, useReducer, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchTrip } from "../util/http";

export const TripContext = createContext({
  tripid: "",
  tripName: "",
  totalBudget: "",
  // save user as obj with (tname, tid)
  travellers: [],
  setCurrentTravellers: (tripid) => {},

  trips: [],
  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid) => {},
  updateTrip: ({ tripid, tripName, tripTotalBudget }) => {},

  setCurrentTrip: ({ tripName, totalBudget }) => {},
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

  async function setCurrentTravellers(tripid) {
    try {
      const trip = await fetchTrip(tripid);
      if (!trip) return;
      console.log(
        "🚀 ~ file: trip-context.js ~ line 55 ~ setCurrentTravellers ~ trip.data",
        trip.data
      );
    } catch (error) {
      console.log(
        "🚀 ~ file: trip-context.js ~ line 57 ~ setCurrentTravellers ~ error",
        error
      );
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

  const [tripid, setTripid] = useState("");
  const [tripName, setTripName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");

  function setCurrentTrip(tripid, tripData) {
    setTripid(tripid);
    setTripName(tripData.tripName);
    setTotalBudget(tripData.totalBudget.toString());
    AsyncStorage.setItem("currentTripId", tripid);
    AsyncStorage.setItem("currentTripName", tripData.tripName);
    AsyncStorage.setItem(
      "currentTripTotalBudget",
      tripData.totalBudget.toString()
    );
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
    const trip = await fetchTrip(tripid);
    if (!trip) {
      console.error("COULD NOT FETCH AND SET TRIP");
      return;
    }
    setCurrentTrip(tripid, trip.data);
  }

  const value = {
    tripid: tripid,
    tripName: tripName,
    totalBudget: totalBudget,
    travellers: travellers,
    setCurrentTravellers: setCurrentTravellers,

    setCurrentTrip: setCurrentTrip,
    deleteCurrentTrip: deleteCurrentTrip,
    getCurrentTripFromStorage: getCurrentTripFromStorage,
    fetchCurrentTrip: fetchCurrentTrip,

    addTrip: addTrip,
    setTrips: setTrips,
    deleteTrip: deleteTrip,
    updateTrip: updateTrip,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
