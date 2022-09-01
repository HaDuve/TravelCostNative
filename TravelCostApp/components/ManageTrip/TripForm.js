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

import Input from "../ManageExpense/Input";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import Button from "../UI/Button";
import FlatButton from "../UI/FlatButton";

const TripForm = ({ navigation }) => {
  const TripCtx = useContext(TripContext);
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const uid = AuthCtx.uid;
  const [inputs, setInputs] = useState({
    tripName: {
      value: "",
      isValid: true,
    },
    totalBudget: {
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
    navigation.navigate("RecentExpenses");
  }

  async function submitHandler(e) {
    const tripData = {};
    tripData.tripName = inputs.tripName.value;
    tripData.totalBudget = +inputs.totalBudget.value;

    const id = await storeTrip(tripData);
    const response = TripCtx.setCurrentTrip(id, tripData);
    storeUserToTrip(id, { travellerid: uid });
    UserCtx.setFreshlyCreatedTo(false);
    navigation.navigate("RecentExpenses");
  }

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
    flexDirection: "row",
    justifyContent: "center",
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
