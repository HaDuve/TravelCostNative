import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useReducer, useState } from "react";
import { Alert } from "react-native";

export const UserContext = createContext({
  userName: "",
  dailybudget: "",
  homeCountry: "",
  homeCurrency: "",
  lastCountry: "",
  lastCurrency: "",
  tripHistory: [],
  periodName: "day",
  setPeriodString: (string: string) => {},

  addUser: ({
    userName,
    dailybudget,
    homeCountry,
    homeCurrency,
    country,
    currency,
  }) => {},
  deleteUser: (uid: string) => {},
  setUserName: (name: string) => {},

  addTripHistory: (tripid: string) => {},
  setTripHistory: (trips: string[]) => {},
  deleteTripHistory: (tripid: string) => {},

  freshlyCreated: false,
  setFreshlyCreatedTo: (bool: boolean) => {},
});

function tripsReducer(state, action) {
  console.log("tripsReducer ~ state", state)
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
  const [dailybudget, setDailyBudget] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");
  const [lastCurrency, setLastCurrency] = useState("");
  const [freshlyCreated, setFreshlyCreated] = useState(false);
  const [periodName, setPeriodName] = useState("day");

  const [tripsState, dispatch] = useReducer(tripsReducer, []);

  function setPeriodString(periodName: string) {
    setPeriodName(periodName);
  }
  function addTripHistory(tripid: string) {
    dispatch({ type: "ADD", payload: tripid });
  }

  function setTripHistory(trips: string[]) {
    dispatch({ type: "SET", payload: trips });
  }

  function deleteTripHistory(tripid: string) {
    dispatch({ type: "DELETE", payload: tripid });
  }

  function addUser(UserData: any) {
    // TODO: create User interface for typeScript
    if (!UserData) return;

    if (UserData.userName) {
      setName(UserData.userName);
    }
    if (UserData.dailybudget) {
      setDailyBudget(UserData.dailybudget.toString());
    }
    if (UserData.homeCountry) {
      setHomeCountry(UserData.homeCountry);
    }
    if (UserData.homeCurrency) {
      setHomeCurrency(UserData.homeCurrency);
    }
    if (UserData.lastCountry) {
      setLastCountry(UserData.lastCountry);
    }
    if (UserData.lastCurrency) {
      setLastCurrency(UserData.lastCurrency);
    }
    if (UserData.tripHistory) {
      setTripHistory(UserData.tripHistory);
    }
  }

  function setFreshlyCreatedTo(bool: boolean) {
    setFreshlyCreated(bool);
    AsyncStorage.setItem("freshlyCreated", bool.toString());
  }

  function deleteUser(id: string) {
    Alert.alert("delete context not implemented");
  }
  function setUserName(name: string) {
    if (!name || name.length < 1) return;
    setName(name);
  }

  const value = {
    userName: userName,
    dailybudget: dailybudget,
    homeCountry: homeCountry,
    homeCurrency: homeCurrency,
    lastCountry: lastCountry,
    lastCurrency: lastCurrency,
    periodName: periodName,
    setPeriodString: setPeriodString,

    tripHistory: tripsState,

    freshlyCreated: freshlyCreated,
    setFreshlyCreatedTo: setFreshlyCreatedTo,

    addTripHistory: addTripHistory,
    setTripHistory: setTripHistory,
    deleteTripHistory: deleteTripHistory,

    addUser: addUser,
    deleteUser: deleteUser,
    setUserName: setUserName,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
