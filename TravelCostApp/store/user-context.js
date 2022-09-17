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

  addUser: ({
    userName,
    dailybudget,
    homeCountry,
    homeCurrency,
    country,
    currency,
  }) => {},
  deleteUser: (uid) => {},
  setUserName: (name) => {},

  addTripHistory: (tripData) => {},
  setTripHistory: (trips) => {},
  deleteTripHistory: (tripid) => {},

  freshlyCreated: false,
  setFreshlyCreatedTo: (bool) => {},
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
  const [dailybudget, setDailyBudget] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");
  const [lastCurrency, setLastCurrency] = useState("");
  const [freshlyCreated, setFreshlyCreated] = useState(false);

  const [tripsState, dispatch] = useReducer(tripsReducer, []);

  function addTripHistory(tripData) {
    dispatch({ type: "ADD", payload: tripData });
  }

  function setTripHistory(trips) {
    dispatch({ type: "SET", payload: trips });
  }

  function deleteTripHistory(tripid) {
    dispatch({ type: "DELETE", payload: tripid });
  }

  function addUser(UserData) {
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

  function setFreshlyCreatedTo(bool) {
    setFreshlyCreated(bool);
  }

  function deleteUser(id) {
    Alert.alert("delete context not implemented");
  }
  function setUserName(name) {
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
