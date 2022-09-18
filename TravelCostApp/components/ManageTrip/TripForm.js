import { useState, useContext, useEffect } from "react";
import { View, Text } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import {
  fetchExpenses,
  fetchUser,
  storeTrip,
  storeUserToTrip,
  updateUser,
} from "../../util/http";

import Input from "../ManageExpense/Input";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import Button from "../UI/Button";
import FlatButton from "../UI/FlatButton";
import { ExpensesContext } from "../../store/expenses-context";

const TripForm = ({ navigation }) => {
  const TripCtx = useContext(TripContext);
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const ExpenseCtx = useContext(ExpensesContext);

  const uid = AuthCtx.uid;
  let currencyPickerRef = undefined;

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

  async function submitHandler(e) {
    const tripData = {};
    tripData.tripName = inputs.tripName.value;
    tripData.totalBudget = +inputs.totalBudget.value;
    tripData.tripCurrency = inputs.tripCurrency.value;
    tripData.dailyBudget = inputs.dailyBudget.value;
    tripData.travellers = [{ userName: UserCtx.userName }];

    const tripid = await storeTrip(tripData);
    tripData.tripid = tripid;

    TripCtx.setCurrentTrip(tripid, tripData);
    UserCtx.addTripHistory(TripCtx.getcurrentTrip());

    storeUserToTrip(tripid, { travellerid: uid });

    updateUser(uid, {
      userName: UserCtx.userName,
      tripHistory: UserCtx.tripHistory,
    });

    const expenses = await fetchExpenses(tripid, uid);
    ExpenseCtx.setExpenses(expenses);

    UserCtx.setFreshlyCreatedTo(false);
    navigation.navigate("Profile");
  }

  const currencyPickJSX = (
    <CurrencyPicker
      currencyPickerRef={(ref) => {
        currencyPickerRef = ref;
      }}
      enable={true}
      darkMode={false}
      currencyCode={inputs.tripCurrency.value}
      showFlag={true}
      showCurrencyName={false}
      showCurrencyCode={false}
      onSelectCurrency={(data) => {
        inputChangedHandler("tripCurrency", data.code);
      }}
      onOpen={() => {
        console.log("Open");
      }}
      onClose={() => {
        console.log("Close");
      }}
      showNativeSymbol={true}
      showSymbol={false}
      containerStyle={{
        container: {
          marginLeft: 0,
          paddingTop: 24,
        },
        flagWidth: 25,
        currencyCodeStyle: { color: GlobalStyles.colors.primary500 },
        currencyNameStyle: { color: GlobalStyles.colors.primary500 },
        symbolStyle: { color: GlobalStyles.colors.primary500 },
        symbolNativeStyle: { color: GlobalStyles.colors.primary500 },
      }}
      modalStyle={{
        container: {},
        searchStyle: {},
        tileStyle: {},
        itemStyle: {
          itemContainer: {},
          flagWidth: 25,
          currencyCodeStyle: {},
          currencyNameStyle: {},
          symbolStyle: {},
          symbolNativeStyle: {},
        },
      }}
      title={"Currency"}
      searchPlaceholder={"Search"}
      showCloseButton={true}
      showModalTitle={true}
    />
  );

  return (
    <View style={styles.form}>
      <View style={styles.card}>
        <Text style={styles.title}>New Trip</Text>
        <Input
          label="Trip Name"
          textInputConfig={{
            onChangeText: inputChangedHandler.bind(this, "tripName"),
            value: inputs.tripName.value,
          }}
          invalid={!inputs.tripName.isValid}
          autoFocus={true}
        />
        <View style={styles.categoryRow}>
          <Input
            style={styles.rowInput}
            label="Total Budget"
            textInputConfig={{
              keyboardType: "decimal-pad",
              onChangeText: inputChangedHandler.bind(this, "totalBudget"),
              value: inputs.totalBudget.value,
            }}
            invalid={!inputs.totalBudget.isValid}
          />
          {currencyPickJSX}
        </View>
        <View style={styles.categoryRow}>
          <Input
            style={styles.rowInput}
            label="Daily Budget"
            textInputConfig={{
              keyboardType: "decimal-pad",
              onChangeText: inputChangedHandler.bind(this, "dailyBudget"),
              value: inputs.dailyBudget.value,
            }}
            invalid={!inputs.dailyBudget.isValid}
          />
          {currencyPickJSX}
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <FlatButton style={styles.button} onPress={cancelHandler}>
          Cancel
        </FlatButton>
        <Button style={styles.button} onPress={submitHandler}>
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
    padding: 12,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  card: {
    margin: 16,
    padding: 12,
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    borderColor: GlobalStyles.colors.gray600,
    shadowColor: GlobalStyles.colors.gray600,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 10,
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
    flex: 0,
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 12,
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
});
