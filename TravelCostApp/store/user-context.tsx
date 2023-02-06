/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useReducer, useState } from "react";
import { Alert } from "react-native";
import { asyncStoreGetItem, asyncStoreSetObject } from "./async-storage";

export const UserContext = createContext({
  userName: "",
  periodName: "day",
  setPeriodString: (string: string) => {},

  addUser: ({ userName }) => {},
  deleteUser: (uid: string) => {},
  setUserName: (name: string) => {},

  addTripHistory: (tripid: string) => {},
  setTripHistory: (trips: string[]) => {},
  getTripHistory: (): string[] => {
    return [""];
  },
  deleteTripHistory: (tripid: string) => {},

  freshlyCreated: false,
  setFreshlyCreatedTo: (bool: boolean) => {},

  isOnline: false,
  setIsOnline: (bool: boolean) => {},
  saveUserNameInStorage: (name: string) => {},
  loadUserNameFromStorage: () => {},
});

function tripsReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET": {
      const inverted = action.payload.reverse();
      return inverted;
    }
    case "DELETE":
      return state.filter((trip) => trip.id !== action.payload);
    default:
      return state;
  }
}

function UserContextProvider({ children }) {
  const [userName, setName] = useState("");
  const [freshlyCreated, setFreshlyCreated] = useState(false);
  const [periodName, setPeriodName] = useState("day");
  const [isOnline, setIsOnline] = useState(false);
  const [tripsState, dispatch] = useReducer(tripsReducer, []);

  function setPeriodString(periodName: string) {
    setPeriodName(periodName);
  }
  function addTripHistory(tripid: string) {
    // console.log("!!!!!!! addTripHistory ~ tripid", tripid);
    dispatch({ type: "ADD", payload: [tripid] });
  }

  function setTripHistory(trips: string[]) {
    // console.log("setTripHistory ~ trips", trips);
    dispatch({ type: "SET", payload: trips });
  }

  function deleteTripHistory(tripid: string) {
    // console.log("deleteTripHistory ~ tripid", tripid);
    dispatch({ type: "DELETE", payload: tripid });
  }

  function addUser(UserData: any) {
    // console.log("addUser ~ UserData", UserData);
    if (!UserData || !UserData.userName) {
      console.log("addUser ~ no UserData to add Username!");
      return;
    }
    setUserName(UserData.userName);
    saveUserNameInStorage(UserData.userName);
  }

  function setFreshlyCreatedTo(bool: boolean) {
    // console.log("setFreshlyCreatedTo ~ bool", bool);
    setFreshlyCreated(bool);
    asyncStoreSetObject("freshlyCreated", bool);
  }

  function deleteUser(id: string) {
    // console.log("deleteUser ~ id", id);
    Alert.alert("delete context not implemented");
  }
  function setUserName(name: string) {
    // console.log("setUserName ~ name", name);
    if (!name || name.length < 1) return;
    setName(name);
  }

  function getTripHistory() {
    console.warn("!!!!!!!!!!!!!! getTripHistory ~ tripsState", tripsState);
    return tripsState;
  }

  function saveUserNameInStorage(name: string) {
    // console.log("saveUserNameInStorage ~ userName", name);
    asyncStoreSetObject("userName", name);
  }

  function loadUserNameFromStorage() {
    console.log("loadUserNameFromStorage ~ userName", userName);
    asyncStoreGetItem("userName").then((name) => {
      if (name) {
        setName(name);
      }
    });
  }

  const value = {
    userName: userName,
    periodName: periodName,
    setPeriodString: setPeriodString,

    freshlyCreated: freshlyCreated,
    setFreshlyCreatedTo: setFreshlyCreatedTo,

    addTripHistory: addTripHistory,
    setTripHistory: setTripHistory,
    getTripHistory: getTripHistory,
    deleteTripHistory: deleteTripHistory,

    addUser: addUser,
    deleteUser: deleteUser,
    setUserName: setUserName,
    isOnline: isOnline,
    setIsOnline: setIsOnline,
    saveUserNameInStorage: saveUserNameInStorage,
    loadUserNameFromStorage: loadUserNameFromStorage,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
