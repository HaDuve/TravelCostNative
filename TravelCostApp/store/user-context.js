import { createContext, useState } from "react";
import { Alert } from "react-native";

export const UserContext = createContext({
  name: "",
  dailyBudget: "",
  homeCountry: "",
  homeCurrency: "",
  lastCountry: "",
  lastCurrency: "",

  addUser: ({
    name,
    dailyBudget,
    homeCountry,
    homeCurrency,
    country,
    currency,
  }) => {},
  deleteUser: (uid) => {},
  updateUser: ({
    name,
    dailyBudget,
    homeCountry,
    homeCurrency,
    country,
    currency,
  }) => {},
});

function UsersContextProvider({ children }) {
  const [userName, setName] = useState("");
  const [dailybudget, setDailyBudget] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("");
  const [lastCountry, setLastCountry] = useState("");
  const [lastCurrency, setLastCurrency] = useState("");

  function addUser(UserData) {
    console.log(
      "ADD USER WAS CALLED",
      "🚀 ~ file: user-context.js ~ line 44 ~ addUser ~ UserData",
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

  const value = {
    userName: userName,
    dailybudget: dailybudget,
    homeCountry: homeCountry,
    homeCurrency: homeCurrency,
    lastCountry: lastCountry,
    lastCurrency: lastCurrency,

    addUser: addUser,
    deleteUser: deleteUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UsersContextProvider;
