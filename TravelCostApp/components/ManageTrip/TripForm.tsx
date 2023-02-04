import React from "react";
import { useState, useContext, useEffect } from "react";
import { View, Text, Alert } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import {
  storeTrip,
  storeTripHistory,
  storeTravellerToTrip,
  updateUser,
  fetchTrip,
  updateTripHistory,
} from "../../util/http";
import * as Updates from "expo-updates";

import Input from "../ManageExpense/Input";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import Button from "../UI/Button";
import FlatButton from "../UI/FlatButton";
import { ExpensesContext } from "../../store/expenses-context";
import CurrencyPicker from "../Currency/CurrencyPicker";
import CurrencyInput from "react-currency-input-field";
import { asyncStoreSetItem } from "../../store/async-storage";

const TripForm = ({ navigation }) => {
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const expenseCtx = useContext(ExpensesContext);

  const [countryValue, setCountryValue] = useState("DE");

  const uid = authCtx.uid;
  const userName = userCtx.userName;
  // let currencyPickerRef = undefined;

  const [inputs, setInputs] = useState({
    tripName: {
      value: "",
      isValid: true,
    },
    totalBudget: {
      value: "",
      isValid: true,
    },
    tripCurrency: {
      value: "EUR",
      isValid: true,
    },
    dailyBudget: {
      value: "",
      isValid: true,
    },
  });

  function inputChangedHandler(inputIdentifier, enteredValue) {
    setInputs((curInputs) => {
      return {
        ...curInputs,
        [inputIdentifier]: { value: enteredValue, isValid: true },
      };
    });
  }
  function cancelHandler() {
    navigation.navigate("Profile");
  }

  async function submitHandler() {
    const tripData = {
      tripName: inputs.tripName.value,
      totalBudget: +inputs.totalBudget.value,
      tripCurrency: inputs.tripCurrency.value,
      dailyBudget: +inputs.dailyBudget.value,
      tripid: "",
    };

    // Tripname should not be empty
    const tripNameIsValid =
      tripData.tripName !== "" && tripData.tripName.length > 0;
    // Total budget should be a number between 1 and 3B
    const totalBudgetIsValid =
      !isNaN(tripData.totalBudget) &&
      tripData.totalBudget > 0 &&
      tripData.totalBudget < 3435973836 &&
      tripData.totalBudget > tripData.dailyBudget;
    const dailyBudgetIsValid =
      !isNaN(tripData.dailyBudget) &&
      tripData.dailyBudget > 0 &&
      tripData.dailyBudget < 3435973836 &&
      tripData.dailyBudget < tripData.totalBudget;

    if (!tripNameIsValid) {
      inputs.tripName.isValid = tripNameIsValid;
      Alert.alert("Please enter a Name for your new Trip Budget");
      return;
    }

    if (!totalBudgetIsValid || !dailyBudgetIsValid) {
      inputs.totalBudget.isValid = totalBudgetIsValid;
      inputs.dailyBudget.isValid = dailyBudgetIsValid;
      Alert.alert(
        "Please enter positive Numbers (Total Budget cannot be lower than Daily Budget)"
      );
      return;
    }

    const tripid = await storeTrip(tripData);
    asyncStoreSetItem("currentTripId", tripid);
    await storeTravellerToTrip(tripid, { userName: userName, uid: uid });

    const newTripData = await fetchTrip(tripid);

    tripCtx.setCurrentTrip(tripid, newTripData);
    // if fresh store TripHistory else update TripHistory
    if (userCtx.freshlyCreated) {
      await storeTripHistory(uid, [tripid]);
    } else {
      await updateTripHistory(uid, tripid);
    }

    updateUser(uid, {
      userName: userName,
      currentTrip: tripid,
    });

    userCtx.setFreshlyCreatedTo(false);
    expenseCtx.setExpenses([]);

    tripCtx.refresh();
    navigation.navigate("RecentExpenses");
  }

  function updateCurrency() {
    inputChangedHandler("tripCurrency", countryValue.split(" ")[0]);
  }

  return (
    <View style={styles.form}>
      <View style={styles.card}>
        <Text style={styles.title}>New Trip Budget</Text>
        <View style={styles.currencyPickerContainer}>
          <CurrencyPicker
            countryValue={countryValue}
            setCountryValue={setCountryValue}
            onChangeValue={updateCurrency}
          ></CurrencyPicker>
        </View>
        <Input
          label="Trip Name"
          style={{ flex: 1 }}
          inputStyle={{}}
          textInputConfig={{
            onChangeText: inputChangedHandler.bind(this, "tripName"),
            value: inputs.tripName.value,
          }}
          invalid={!inputs.tripName.isValid}
          autoFocus={false}
        />
        <View style={styles.categoryRow}>
          <Input
            label={`Total Budget in ${inputs.tripCurrency.value}`}
            style={{ flex: 1 }}
            inputStyle={{}}
            autoFocus={false}
            textInputConfig={{
              keyboardType: "decimal-pad",
              onChangeText: inputChangedHandler.bind(this, "totalBudget"),
              value: inputs.totalBudget.value,
            }}
            invalid={!inputs.totalBudget.isValid}
          />
        </View>
        <View style={styles.categoryRow}>
          <Input
            style={{ flex: 1 }}
            inputStyle={{}}
            autoFocus={false}
            label={`Daily Budget in ${inputs.tripCurrency.value}`}
            textInputConfig={{
              keyboardType: "decimal-pad",
              onChangeText: inputChangedHandler.bind(this, "dailyBudget"),
              value: inputs.dailyBudget.value,
            }}
            invalid={!inputs.dailyBudget.isValid}
          />
        </View>
      </View>
      {/* Add Currency Input field */}
      <View style={styles.buttonContainer}>
        <FlatButton onPress={cancelHandler}>Cancel</FlatButton>
        <Button
          buttonStyle={{}}
          mode={""}
          style={styles.button}
          onPress={submitHandler}
        >
          Save Trip
        </Button>
      </View>
    </View>
  );
};

export default TripForm;

const styles = StyleSheet.create({
  form: {
    flex: 1,
    padding: "2%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  card: {
    flex: 1,
    margin: "4%",
    padding: "4%",
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    borderColor: GlobalStyles.colors.gray600,
    shadowColor: GlobalStyles.colors.gray600,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 10,
  },
  currencyPickerContainer: {
    flex: 1,
    marginBottom: "4%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    marginTop: 5,
    marginBottom: 24,
    textAlign: "center",
  },
  categoryRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  inputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  errorText: {
    textAlign: "center",
    color: GlobalStyles.colors.error500,
    margin: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: "20%",
    marginHorizontal: "10%",
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
});
