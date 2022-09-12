import { createContext, useState } from "react";
import { Alert } from "react-native";

export const UserContext = createContext({
  userName: "",
  dailybudget: "",
  homeCountry: "",
  homeCurrency: "",
  lastCountry: "",
  lastCurrency: "",

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

  freshlyCreated: false,
  setFreshlyCreatedTo: (bool) => {},
});

function UserContextProvider({ children }) {
  const [userName, setName] = useState("");
  const [dailybudget, setDailyBudget] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");
  const [lastCurrency, setLastCurrency] = useState("");
  const [freshlyCreated, setFreshlyCreated] = useState(false);

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

    freshlyCreated: freshlyCreated,
    setFreshlyCreatedTo: setFreshlyCreatedTo,

    addUser: addUser,
    deleteUser: deleteUser,
    setUserName: setUserName,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
