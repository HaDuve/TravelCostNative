import { useState, useContext, useEffect } from "react";
import { View, Text, Alert } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { UserContext } from "../../store/user-context";
import { fetchUser, updateUser } from "../../util/http";
import { Button } from "react-native";

import Input from "../ManageExpense/Input";
import ErrorOverlay from "../UI/ErrorOverlay";
import LoadingOverlay from "../UI/LoadingOverlay";
import IconButton from "../UI/IconButton";

const ProfileForm = ({ onCancel }) => {
  const AuthCtx = useContext(AuthContext);
  const User = useContext(UserContext);
  const uid = AuthContext.uid;

  function logoutHandler() {
    return Alert.alert("Are your sure?", "Are you sure you want to logout?", [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: "No",
      },
      // The "Yes" button
      {
        text: "Yes",
        onPress: () => {
          Alert.AuthCtx.logout();
        },
      },
    ]);
  }
  const [inputs, setInputs] = useState({
    userName: {
      value: !User.userName ? "" : User.userName,
      isValid: true,
    },
    dailybudget: {
      value: User.dailybudget ? User.dailybudget : "",
      isValid: true,
    },
    homeCountry: {
      value: User.homeCountry ? User.homeCountry : "",
      isValid: true,
    },
    homeCurrency: {
      value: User.homeCurrency ? User.homeCurrency : "",
      isValid: true,
    },
    lastCountry: {
      value: User.lastCountry ? User.lastCountry : "",
      isValid: true,
    },
    lastCurrency: {
      value: User.lastCurrency ? User.lastCurrency : "",
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

    User.addUser(userData);
    await updateUser(AuthCtx.uid, userData);
  }

  return (
    <View style={styles.form}>
      <View style={styles.avatarBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {inputs.userName.value.charAt(0)}
          </Text>
        </View>
        <Text>Change Avatar</Text>
        <Text>Delete Avatar</Text>
      </View>
      <Input
        label="Name"
        textInputConfig={{
          onChangeText: inputChangedHandler.bind(this, "userName"),
          value: inputs.userName.value,
        }}
        invalid={!inputs.userName.isValid}
      />
      <View style={styles.inputsRow}>
        <Input
          style={styles.rowInput}
          label="Daily Budget"
          textInputConfig={{
            keyboardType: "decimal-pad",
            onChangeText: inputChangedHandler.bind(this, "dailybudget"),
            value: inputs.dailybudget.value,
          }}
          invalid={!inputs.dailybudget.isValid}
        />

        <Input
          style={styles.rowInput}
          label="homeCountry"
          textInputConfig={{
            onChangeText: inputChangedHandler.bind(this, "homeCountry"),
            value: inputs.homeCountry.value,
          }}
          invalid={!inputs.homeCountry.isValid}
        />
        <Input
          style={styles.rowInput}
          label="homeCurrency"
          textInputConfig={{
            onChangeText: inputChangedHandler.bind(this, "homeCurrency"),
            value: inputs.homeCurrency.value,
          }}
          invalid={!inputs.homeCurrency.isValid}
        />
      </View>
      <View style={styles.inputsRow}>
        <Input
          style={styles.rowInput}
          label="lastCountry"
          textInputConfig={{
            onChangeText: inputChangedHandler.bind(this, "lastCountry"),
            value: inputs.lastCountry.value,
          }}
          invalid={!inputs.lastCountry.isValid}
        />
        <Input
          style={styles.rowInput}
          label="lastCurrency"
          textInputConfig={{
            onChangeText: inputChangedHandler.bind(this, "lastCurrency"),
            value: inputs.lastCurrency.value,
          }}
          invalid={!inputs.lastCurrency.isValid}
        />
      </View>
      <View style={styles.buttonContainer}>
        <IconButton
          icon={"exit-outline"}
          size={24}
          color={GlobalStyles.colors.textColor}
          style={styles.button}
          onPress={logoutHandler}
        />

        <IconButton
          icon={"close-outline"}
          size={24}
          color={GlobalStyles.colors.backgroundColor}
          style={styles.button}
          onPress={onCancel}
        />
        <IconButton
          icon={"checkmark"}
          size={24}
          color={GlobalStyles.colors.primary400}
          style={styles.button}
          onPress={submitHandler}
        />
      </View>
    </View>
  );
};

export default ProfileForm;

const styles = StyleSheet.create({
  form: {
    flex: 1,
    marginTop: 10,
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 8,
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
});
