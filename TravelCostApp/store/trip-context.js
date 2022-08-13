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
    console.log(
      "🚀 ~ file: trip-context.js ~ line 22 ~ setCurrentTrip ~ tripid",
      tripid
    );
    setTripName(tripData.tripName);
    console.log(
      "🚀 ~ file: trip-context.js ~ line 24 ~ setCurrentTrip ~ tripData.tripName",
      tripData.tripName
    );
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
    console.log(
      "🚀 ~ file: trip-context.js ~ line 40 ~ getCurrentTripFromStorage ~ getCurrentTripFromStorage",
      getCurrentTripFromStorage
    );
    // TODO: add a security check via user id
    const id = await AsyncStorage.getItem("currentTripId");
    const name = await AsyncStorage.getItem("currentTripName");
    const budget = await AsyncStorage.getItem("currentTripTotalBudget");

    if (id) {
      setTripid(id);
      console.log(
        "🚀 ~ file: trip-context.js ~ line 41 ~ getCurrentTripFromStorage ~ id",
        id
      );
      setTripName(name);
      console.log(
        "🚀 ~ file: trip-context.js ~ line 43 ~ getCurrentTripFromStorage ~ name",
        name
      );
      setTotalBudget(budget);
    } else console.log("no trip stored in memory");
  }

  function deleteTrip(id) {
    Alert.alert("delete context not implemented");
  }

  async function fetchCurrentTrip(tripid) {
    const trip = await fetchTrip(tripid);
    console.log(
      "🚀 ~ file: trip-context.js ~ line 74 ~ fetchCurrentTrip ~ trip",
      trip
    );
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
