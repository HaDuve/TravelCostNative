import { useState, useContext, useEffect } from "react";
import { View, Text } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { UserContext } from "../../store/user-context";
import { fetchUser, updateUser } from "../../util/http";
import { Button } from "react-native";

import Input from "../ManageExpense/Input";
import ErrorOverlay from "../UI/ErrorOverlay";
import LoadingOverlay from "../UI/LoadingOverlay";

const ProfileForm = (defaultValues) => {
  const User = useContext(UserContext);

  console.log("User.name : ", User.name);
  const AuthCtx = useContext(AuthContext);
  const uid = AuthContext.uid;

  const [inputs, setInputs] = useState({
    userName: {
      value: User.userName ? User.userName : "",
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
    console.log(
      "🚀 ~ file: ProfileForm.js ~ line 59 ~ submitHandler ~ submitHandler",
      submitHandler
    );
    const userData = {};
    userData.userName = inputs.userName.value;
    userData.dailybudget = +inputs.dailybudget.value;
    userData.homeCountry = inputs.homeCountry.value;
    userData.homeCurrency = inputs.homeCurrency.value;
    userData.lastCountry = inputs.lastCountry.value;
    userData.lastCurrency = inputs.lastCurrency.value;

    console.log(
      "🚀 ~ file: ProfileForm.js ~ line 64 ~ submitHandler ~ userData",
      userData
    );
    User.addUser(userData);
    await updateUser(AuthCtx.uid, userData);
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title}>User Profile</Text>
      <Input
        label="Name"
        textInputConfig={{
          onChangeText: inputChangedHandler.bind(this, "userName"),
          value: inputs.userName.value,
        }}
        invalid={!inputs.userName.isValid}
      />
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

      <View style={styles.inputsRow}>
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
        <Button style={styles.button} title="SAVE" onPress={submitHandler}>
          SAVE
        </Button>
        <Button style={styles.button} title="LOGOUT" onPress={AuthCtx.logout}>
          LOGOUT
        </Button>
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