import { createContext, useReducer, useState } from "react";
import { Alert } from "react-native";
import { asyncStoreSetObject } from "./async-storage";

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
});

function tripsReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "SET":
      const inverted = action.payload.reverse();
      return inverted;
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

  const [tripsState, dispatch] = useReducer(tripsReducer, []);

  function setPeriodString(periodName: string) {
    setPeriodName(periodName);
  }
  function addTripHistory(tripid: string) {
    console.log("!!!!!!! addTripHistory ~ tripid", tripid);
    dispatch({ type: "ADD", payload: [tripid] });
  }

  function setTripHistory(trips: string[]) {
    console.log("setTripHistory ~ trips", trips);
    dispatch({ type: "SET", payload: trips });
  }

  function deleteTripHistory(tripid: string) {
    console.log("deleteTripHistory ~ tripid", tripid);
    dispatch({ type: "DELETE", payload: tripid });
  }

  function addUser(UserData: any) {
    if (!UserData || !UserData.userName) return;
    setUserName(UserData.userName);
  }

  function setFreshlyCreatedTo(bool: boolean) {
    console.log("setFreshlyCreatedTo ~ bool", bool);
    setFreshlyCreated(bool);
    asyncStoreSetObject("freshlyCreated", bool);
  }

  function deleteUser(id: string) {
    Alert.alert("delete context not implemented");
  }
  function setUserName(name: string) {
    console.log("setUserName ~ name", name);
    if (!name || name.length < 1) return;
    setName(name);
  }

  function getTripHistory() {
    console.warn("!!!!!!!!!!!!!! getTripHistory ~ tripsState", tripsState);
    return tripsState;
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
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
