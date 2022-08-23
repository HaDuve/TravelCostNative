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
});

function UserContextProvider({ children }) {
  const [userName, setName] = useState("");
  const [dailybudget, setDailyBudget] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");
  const [lastCurrency, setLastCurrency] = useState("");

  function addUser(UserData) {
    console.log(
      "🚀 ~ file: user-context.js ~ line 32 ~ addUser ~ UserData",
      UserData
    );

    setName(UserData.userName);
    setDailyBudget(UserData.dailybudget.toString());
    setHomeCountry(UserData.homeCountry);
    setHomeCurrency(UserData.homeCurrency);
    setLastCountry(UserData.lastCountry);
    setLastCurrency(UserData.lastCurrency);
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

    addUser: addUser,
    deleteUser: deleteUser,
    setUserName: setUserName,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
