import { useState, useContext, useEffect } from "react";
import { View, Text, Alert, Keyboard, Dimensions } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { UserContext } from "../../store/user-context";
import {
  fetchTripUsers,
  fetchUser,
  getTravellers,
  updateUser,
} from "../../util/http";

import Input from "../ManageExpense/Input";
import ErrorOverlay from "../UI/ErrorOverlay";
import LoadingOverlay from "../UI/LoadingOverlay";
import IconButton from "../UI/IconButton";
import Button from "../UI/Button";
import { TripContext } from "../../store/trip-context";
import FlatButton from "../UI/FlatButton";

const ProfileForm = ({ navigation, onCancel }) => {
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const TripCtx = useContext(TripContext);
  const freshlyCreated = UserCtx.freshlyCreated;

  let currencyPickerRef = undefined;

  function logoutHandler() {
    return Alert.alert("Are you sure?", "Are you sure you want to logout?", [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: "No",
      },
      // The "Yes" button
      {
        text: "Yes",
        onPress: () => {
          AuthCtx.logout();
        },
      },
    ]);
  }
  const [inputs, setInputs] = useState({
    userName: {
      value: !UserCtx.userName ? "" : UserCtx.userName,
      isValid: true,
    },
    dailybudget: {
      value: UserCtx.dailybudget ? UserCtx.dailybudget : "",
      isValid: true,
    },
    homeCountry: {
      value: UserCtx.homeCountry ? UserCtx.homeCountry : "",
      isValid: true,
    },
    homeCurrency: {
      value: UserCtx.homeCurrency ? UserCtx.homeCurrency : "",
      isValid: true,
    },
    lastCountry: {
      value: UserCtx.lastCountry ? UserCtx.lastCountry : "",
      isValid: true,
    },
    lastCurrency: {
      value: UserCtx.lastCurrency ? UserCtx.lastCurrency : "",
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
    const userData = {};
    userData.userName = inputs.userName.value;
    userData.dailybudget = +inputs.dailybudget.value;
    userData.homeCountry = inputs.homeCountry.value;
    userData.homeCurrency = inputs.homeCurrency.value;
    userData.lastCountry = inputs.lastCountry.value;
    userData.lastCurrency = inputs.lastCurrency.value;

    const invalid = userData.userName.length == 0;

    if (invalid) {
      Alert.alert("Check your profile for invalid entries please!");
      return;
    }
    UserCtx.addUser(userData);

    try {
      await updateUser(AuthCtx.uid, userData);
      if (!UserCtx.freshlyCreated) {
        return;
      }
    } catch (error) {
      Alert.alert("Could not save Profile! :(");
    }
  }

  function cancelHandler() {
    setInputs((curInputs) => {
      return {
        ...curInputs,
        ["userName"]: { value: UserCtx.userName, isValid: true },
      };
    });
    Keyboard.dismiss();
  }

  const changedName = inputs.userName.value !== UserCtx.userName;
  const changedNameButtons = (
    <View style={styles.buttonContainer}>
      <IconButton
        icon={"close-outline"}
        size={36}
        color={GlobalStyles.colors.accent500}
        style={styles.button}
        onPress={cancelHandler}
      />
      <IconButton
        icon={"checkmark"}
        size={36}
        color={GlobalStyles.colors.primary500}
        style={styles.button}
        onPress={submitHandler}
      />
    </View>
  );

  function joinInvite() {
    // TODO: this hardcoded join
    navigation.navigate("Join", { id: "-NCIxnq4MrQjGB_unKiE" });
  }

  const freshlyNavigationButtons = (
    <View style={styles.navButtonContainer}>
      <FlatButton style={styles.navButton} onPress={joinInvite}>
        I have an invitation from another Traveller!
      </FlatButton>
      {/*  for debugging i leave this condition only around this button, it should be around the whole view though */}
      {freshlyCreated && (
        <Button
          style={styles.navButton}
          onPress={() => navigation.navigate("ManageTrip")}
        >
          Create first Trip
        </Button>
      )}
    </View>
  );

  return (
    <View style={styles.form}>
      <View style={styles.avatarBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {/* TODO: Profile Picture for now replaced with first char of the name */}
            {inputs.userName.value.charAt(0)}
          </Text>
        </View>
        <IconButton
          icon={"exit-outline"}
          size={36}
          color={GlobalStyles.colors.textColor}
          style={styles.button}
          onPress={logoutHandler}
        />
      </View>
      <View style={styles.inputsRow}>
        <Input
          label="Name"
          style={styles.rowInput}
          inputStyle={styles.inputStyle}
          textInputConfig={{
            onChangeText: inputChangedHandler.bind(this, "userName"),
            value: inputs.userName.value,
          }}
          invalid={!inputs.userName.isValid}
        />
      </View>
      <View style={styles.inputsRow}></View>
      {changedName && changedNameButtons}
      {freshlyNavigationButtons}
    </View>
  );
};

export default ProfileForm;

const styles = StyleSheet.create({
  form: {
    flex: 1,
    marginTop: 10,
    minHeight: 250,
  },
  avatarBar: {
    marginTop: 48,
    marginHorizontal: 12,
    padding: 4,
    minHeight: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    minHeight: 60,
    minWidth: 60,
    borderRadius: 60,
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: GlobalStyles.colors.backgroundColor,
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
  inputStyle: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  errorText: {
    textAlign: "center",
    color: GlobalStyles.colors.error500,
    margin: 8,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 8,
    minHeight: 100,
  },
  navButtonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignContent: "flex-end",
    padding: 24,
  },
  navButton: {
    minWidth: 120,
    marginVertical: 8,
    marginTop: 36,
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
});
