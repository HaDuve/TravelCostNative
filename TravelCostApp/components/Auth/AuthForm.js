import { useState } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { GlobalStyles } from "../../constants/styles";

import Button from "../UI/Button";
import Input from "./Input";

function AuthForm({ isLogin, onSubmit, credentialsInvalid }) {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredName, setenteredName] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");

  const {
    name: nameIsInvalid,
    email: emailIsInvalid,
    password: passwordIsInvalid,
  } = credentialsInvalid;

  function updateInputValueHandler(inputType, enteredValue) {
    switch (inputType) {
      case "email":
        setEnteredEmail(enteredValue);
        break;
      case "name":
        setenteredName(enteredValue);
        break;
      case "password":
        setEnteredPassword(enteredValue);
        break;
    }
  }

  function submitHandler() {
    onSubmit({
      name: enteredName,
      email: enteredEmail,
      password: enteredPassword,
    });
  }

  return (
    <View style={styles.form}>
      <View>
        <View style={styles.iconContainer}>
          <Image
            source={require("../../assets/icon.png")}
            style={{ width: 60, height: 60 }}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            {isLogin ? "Login" : "Create account"}
          </Text>
          <Text style={styles.subTitleText}>
            {isLogin
              ? "Welcome back, sign in to continue using the Expense Tracker"
              : "Enter your credentials here or signup easily via Google."}
          </Text>
        </View>

        {!isLogin && (
          <Input
            label="Name"
            onUpdateValue={updateInputValueHandler.bind(this, "name")}
            value={enteredName}
            isInvalid={nameIsInvalid}
          />
        )}
        <Input
          label="Email Address"
          onUpdateValue={updateInputValueHandler.bind(this, "email")}
          value={enteredEmail}
          keyboardType="email-address"
          isInvalid={emailIsInvalid}
        />

        <Input
          label="Password"
          onUpdateValue={updateInputValueHandler.bind(this, "password")}
          secure
          value={enteredPassword}
          isInvalid={passwordIsInvalid}
        />

        <View style={styles.buttons}>
          <Button onPress={submitHandler} style>
            {isLogin ? "Login" : "Create account"}
          </Button>
        </View>
        <View style={styles.orTextContainer}>
          <Text style={styles.orText}>Or With</Text>
          <View style={styles.google}>
            <Text style={styles.googleText}>Sign Up with Google</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default AuthForm;

const styles = StyleSheet.create({
  form: {},
  buttons: {
    marginTop: 12,
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: GlobalStyles.colors.error300,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  titleContainer: {
    minHeight: 80,
    marginVertical: 18,
    alignItems: "center",
    justifyContent: "space-around",
  },
  titleText: {
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
    fontSize: 28,
    fontWeight: "bold",
  },
  subTitleText: {
    textAlign: "center",
    color: GlobalStyles.colors.gray700,
    fontSize: 14,
  },
  orTextContainer: {
    margin: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  orText: {
    fontSize: 12,
    fontWeight: "bold",
    color: GlobalStyles.colors.gray600,
  },
  google: {
    marginTop: 12,
    margin: 4,
    padding: 8,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
    borderRadius: 8,
  },
  googleText: {
    fontSize: 18,
    color: GlobalStyles.colors.textColor,
  },
});
