import React from "react";
import { useState, useContext, useEffect, useLayoutEffect } from "react";
import { View, Text, Alert, KeyboardAvoidingView } from "react-native";
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
  updateTrip,
  deleteTrip,
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

//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
import LoadingOverlay from "../UI/LoadingOverlay";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;
const TripForm = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(false);
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
      value: "",
      isValid: true,
    },
    dailyBudget: {
      value: "",
      isValid: true,
    },
  });

  const editedTripId = route.params?.tripId;
  const isEditing = !!editedTripId;

  useLayoutEffect(() => {
    const setEditedTrip = async () => {
      setIsLoading(true);
      const selectedTrip = await fetchTrip(editedTripId);
      inputChangedHandler("tripName", selectedTrip.tripName);
      inputChangedHandler("tripCurrency", selectedTrip.tripCurrency);
      inputChangedHandler("dailyBudget", selectedTrip.dailyBudget.toString());
      inputChangedHandler("totalBudget", selectedTrip.totalBudget.toString());
      setIsLoading(false);
    };
    if (isEditing) {
      setEditedTrip();
    }
  }, [editedTripId, isEditing]);

  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const expenseCtx = useContext(ExpensesContext);

  const [countryValue, setCountryValue] = useState(
    inputs?.tripCurrency ? inputs.tripCurrency.value : i18n.t("currencyLabel")
  );

  const uid = authCtx.uid;
  const userName = userCtx.userName;
  // let currencyPickerRef = undefined;

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

  function deleteHandler() {
    Alert.alert(
      // i18n.t("deleteTripTitle"),
      "Delete Trip",
      // i18n.t("deleteTripMessage"),
      "Are you sure you want to delete this Trip? [Delete Function coming soon ...]",
      [
        {
          text: i18n.t("cancel"),
          style: "cancel",
        },
        {
          // text: i18n.t("delete"),
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // TODO: find out how the whole routine should work
            // await deleteTrip(editedTripId);
            navigation.navigate("Profile");
          },
        },
      ],
      { cancelable: false }
    );
  }

  async function submitHandler(setActive = false) {
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
    // tripCurrency should not be empty
    const tripCurrencyIsValid =
      tripData.tripCurrency !== "" && tripData.tripCurrency.length > 0;
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

    if (!tripCurrencyIsValid) {
      inputs.tripCurrency.isValid = tripCurrencyIsValid;
      Alert.alert("Please select a Currency");
      return;
    }
    // if isEditing update Trip, else store
    console.log("submitHandler ~ setActive:", setActive);
    if (isEditing) {
      await updateTrip(editedTripId, tripData);
      if (editedTripId === tripCtx.tripid || setActive) {
        await tripCtx.fetchAndSetCurrentTrip(editedTripId);
      }
      tripCtx.refresh();
      navigation.navigate("Profile");
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
    navigation.navigate("Profile");
  }

  function updateCurrency() {
    inputChangedHandler("tripCurrency", countryValue.split(" ")[0]);
  }

  const titleString = isEditing ? "Edit Trip Budget" : "New Trip Budget";

  if (isLoading) {
    return <LoadingOverlay />;
  }
  return (
    <View style={styles.form}>
      <View style={styles.card}>
        <Text style={styles.title}>{titleString}</Text>

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
        <View style={styles.currencyPickerContainer}>
          <CurrencyPicker
            placeholder={inputs.tripCurrency.value}
            countryValue={countryValue}
            setCountryValue={setCountryValue}
            onChangeValue={updateCurrency}
          ></CurrencyPicker>
        </View>
      </View>
      {/* Add Currency Input field */}
      <View style={styles.buttonContainer}>
        <FlatButton onPress={cancelHandler}>Cancel</FlatButton>
        {!isEditing ? (
          <Button
            buttonStyle={{}}
            mode={""}
            style={styles.button}
            onPress={submitHandler.bind(this, true /* setActive */)}
          >
            Save Changes
          </Button>
        ) : (
          <FlatButton
            buttonStyle={{}}
            mode={""}
            style={styles.button}
            onPress={submitHandler.bind(this, false /* setActive */)}
          >
            Save Changes{" "}
          </FlatButton>
        )}
      </View>
      {/* Horizontal container */}

      <View style={styles.buttonContainer}>
        {isEditing && (
          <Button
            buttonStyle={{ backgroundColor: GlobalStyles.colors.error300 }}
            mode={""}
            style={[styles.button, { marginBottom: 8, marginHorizontal: 24 }]}
            onPress={deleteHandler}
          >
            Delete
          </Button>
        )}
        {isEditing && (
          <Button
            buttonStyle={{}}
            mode={""}
            style={[styles.button, { marginBottom: 8, marginHorizontal: 24 }]}
            onPress={submitHandler.bind(this, true /* setActive */)}
          >
            Set Active
          </Button>
        )}
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

    marginTop: "4%",
    marginHorizontal: "4%",
  },
  button: {
    minWidth: "35%",
    marginHorizontal: 0,
  },
});
