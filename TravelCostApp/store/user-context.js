import { createContext, useState } from "react";
import { Alert } from "react-native";

export const UserContext = createContext({
  uid: "",
  name: "",
  dailyBudget: "",
  homeCountry: "",
  homeCurrency: "",
  lastCountry: "",
  lastCurrency: "",

  addUser: ({
    uid,
    name,
    dailyBudget,
    homeCountry,
    homeCurrency,
    country,
    currency,
  }) => {},
  deleteUser: (uid) => {},
  updateUser: ({
    uid,
    name,
    dailyBudget,
    homeCountry,
    homeCurrency,
    country,
    currency,
  }) => {},
});

function UsersContextProvider({ children }) {
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");
  const [lastCurrency, setLastCurrency] = useState("");

  function addUser(UserData) {
    setUid(UserData.uid);
    setName(UserData.name);
    setDailyBudget(UserData.dailyBudget);
    setHomeCountry(UserData.homeCountry);
    setHomeCurrency(UserData.homeCurrency);
    setLastCountry(UserData.lastCountry);
    setLastCurrency(UserData.lastCurrency);
  }

  function deleteUser(id) {
    Alert.alert("delete context not implemented");
  }

  function updateUser(UserData) {
    addUser(UserData);
  }

  const value = {
    uid: uid,
    name: name,
    dailyBudget: dailyBudget,
    homeCountry: homeCountry,
    homeCurrency: homeCurrency,
    lastCountry: lastCountry,
    lastCurrency: lastCurrency,

    addUser: addUser,
    deleteUser: deleteUser,
    updateUser: updateUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UsersContextProvider;
