import { useState } from "react";
import React, { Alert, StyleSheet, View, Text } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { useNavigation } from "@react-navigation/native";

import FlatButton from "../UI/FlatButton";
import AuthForm from "./AuthForm";
import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";

function AuthContent({ isLogin, onAuthenticate }) {
  const navigation = useNavigation();

  const [credentialsInvalid, setCredentialsInvalid] = useState({
    name: false,
    email: false,
    password: false,
  });

  function switchAuthModeHandler() {
    if (isLogin) {
      navigation.replace("Signup");
    } else {
      navigation.replace("Login");
    }
  }

  function submitHandler(credentials: {
    name: string;
    email: string;
    password: string;
  }) {
    let { name, email, password } = credentials;

    name = name.trim();
    email = email.trim();
    password = password.trim();

    const nameIsValid = name.length > 0 && name.length < 256;
    const emailIsValid = email.includes("@") && email.includes(".");
    const passwordIsValid = password.length > 6;

    if ((!nameIsValid || !emailIsValid || !passwordIsValid) && !isLogin) {
      Alert.alert(i18n.t("authError"), i18n.t("invalidInput"));
      setCredentialsInvalid({
        name: !nameIsValid,
        email: !emailIsValid,
        password: !passwordIsValid,
      });
      return;
    }
    onAuthenticate({ name, email, password });
  }

  return (
    <View style={styles.authContent}>
      <AuthForm
        isLogin={isLogin}
        onSubmit={submitHandler}
        credentialsInvalid={credentialsInvalid}
      />
      <View style={styles.buttons}>
        <Text style={styles.secondaryText}>
          {isLogin ? i18n.t("noAccountText") : i18n.t("alreadyAccountText")}
        </Text>
        <FlatButton onPress={switchAuthModeHandler}>
          {isLogin ? i18n.t("createNewUser") : i18n.t("loginInstead")}
        </FlatButton>
      </View>
    </View>
  );
}

export default AuthContent;

AuthContent.propType = {
  onAuthenticate: PropTypes.func.isRequired,
  isLogin: PropTypes.bool,
};

const styles = StyleSheet.create({
  authContent: {
    padding: "6%",
    marginTop: "10%",
    marginBottom: "8%",
    marginHorizontal: "6%",

    borderRadius: 8,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  buttons: {
    flexDirection: i18n.locale !== "en" ? "column" : "row",
    marginTop: "4%",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 14,
    paddingVertical: "2%",
    paddingHorizontal: "2%",
    color: GlobalStyles.colors.gray700,
    fontWeight: "300",
  },
});
