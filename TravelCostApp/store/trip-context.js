import { createContext, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchTrip } from "../util/http";

export const TripContext = createContext({
  tripid: "",
  tripName: "",
  totalBudget: "",

  setCurrentTrip: ({ tripName, totalBudget }) => {},
  deleteTrip: (uid) => {},
  getCurrentTripFromStorage: () => {},
  fetchCurrentTrip: (tripid) => {},
});

function TripContextProvider({ children }) {
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
    // TODO: find out why this doesnt seem to work
    // TODO: add a security check via user id
    const id = await AsyncStorage.getItem("currentTripId");
    const name = await AsyncStorage.getItem("currentTripName");
    const budget = await AsyncStorage.getItem("currentTripTotalBudget");

    if (id) {
      setTripName(name);
      setTotalBudget(budget);
    } else console.log("no trip stored in memory");
  }

  function deleteTrip(id) {
    Alert.alert("delete context not implemented");
  }

  async function fetchCurrentTrip(tripid) {
    const trip = await fetchTrip(tripid);
    if (!trip) {
      console.log("COULD NOT FETCH AND SET TRIP");
      return;
    }
    setCurrentTrip(tripid, trip);
  }

  const value = {
    tripid: tripid,
    tripName: tripName,
    totalBudget: totalBudget,

    setCurrentTrip: setCurrentTrip,
    deleteTrip: deleteTrip,
    getCurrentTripFromStorage: getCurrentTripFromStorage,
    fetchCurrentTrip: fetchCurrentTrip,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
