import { useState, useContext, useEffect } from "react";
import { View, Text } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import {
  fetchUser,
  storeTrip,
  storeUserToTrip,
  updateUser,
} from "../../util/http";
import { Button } from "react-native";

import Input from "../ManageExpense/Input";
import ErrorOverlay from "../UI/ErrorOverlay";
import LoadingOverlay from "../UI/LoadingOverlay";
import { TripContext } from "../../store/trip-context";
import ShareExample from "../Share/ShareExample";

const TripForm = ({ navigation }) => {
  const TripCtx = useContext(TripContext);
  const AuthCtx = useContext(AuthContext);
  const uid = AuthCtx.uid;
  const [inputs, setInputs] = useState({
    tripName: {
      value: TripCtx.tripName ? TripCtx.tripName : "",
      isValid: true,
    },
    totalBudget: {
      value: TripCtx.totalBudget ? TripCtx.totalBudget : "",
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

  async function submitHandler(e) {
    const tripData = {};
    tripData.tripName = inputs.tripName.value;
    tripData.totalBudget = +inputs.totalBudget.value;

    const id = await storeTrip(tripData);
    const response = await TripCtx.setCurrentTrip(id, tripData);
    storeUserToTrip(id, { travellerid: uid });
    navigation.navigate("RecentExpenses");
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title}>New Trip</Text>
      <Input
        label="Trip Name"
        textInputConfig={{
          onChangeText: inputChangedHandler.bind(this, "tripName"),
          value: inputs.tripName.value,
        }}
        invalid={!inputs.tripName.isValid}
      />
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

      <View style={styles.buttonContainer}>
        <Button style={styles.button} title="SAVE" onPress={submitHandler}>
          SAVE
        </Button>
        <ShareExample />
      </View>
    </View>
  );
};

export default TripForm;

const styles = StyleSheet.create({
  form: {
    flex: 1,
    marginTop: 10,
    backgroundColor: GlobalStyles.colors.primary700,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 5,
    marginBottom: 24,
    textAlign: "center",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  inputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowInput: {
    flex: 1,
  },
  errorText: {
    textAlign: "center",
    color: GlobalStyles.colors.error500,
    margin: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
});
