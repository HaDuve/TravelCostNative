import { useHeaderHeight } from "@react-navigation/elements";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import PropTypes from "prop-types";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

//Localization

import { GlobalStyles } from "../../constants/styles";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { useNavigation } from "@react-navigation/native";

import { RootNavigationProp } from "../../types/navigation";
import { dynamicScale } from "../../util/scalingUtil";
import FlatButton from "../UI/FlatButton";

import AuthForm from "./AuthForm";

function AuthContent({ isLogin, onAuthenticate, isConnected }) {
  const navigation = useNavigation<RootNavigationProp>();

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

  async function submitHandler(credentials: {
    name: string;
    email: string;
    password: string;
  }) {
    let { name, email, password } = credentials;

    name = name.trim();
    email = email.trim();
    password = password.trim();

    const nameIsValid = name?.length > 0 && name?.length < 256;
    const emailIsValid = email.includes("@") && email.includes(".");
    const passwordIsValid = password?.length > 5;

    if ((!nameIsValid || !emailIsValid || !passwordIsValid) && !isLogin) {
      Alert.alert(i18n.t("authError"), i18n.t("invalidInput"));
      setCredentialsInvalid({
        name: !nameIsValid,
        email: !emailIsValid,
        password: !passwordIsValid,
      });
      return;
    }
    await onAuthenticate({ name, email, password });
  }

  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ android: undefined, ios: "position" })}
      keyboardVerticalOffset={Platform.select({
        android: headerHeight,
        ios: 0,
      })}
    >
      <ScrollView style={styles.container}>
        <View style={styles.authContent}>
          <AuthForm
            isLogin={isLogin}
            isConnected={isConnected}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default AuthContent;

AuthContent.propTypes = {
  onAuthenticate: PropTypes.func.isRequired,
  isLogin: PropTypes.bool,
  isConnected: PropTypes.bool,
};

const styles = StyleSheet.create({
  authContent: {
    marginBottom: dynamicScale(20, true),
    marginHorizontal: dynamicScale(16),
    marginTop: dynamicScale(30, true),
    padding: dynamicScale(16),
    ...Platform.select({
      android: {
        marginBottom: dynamicScale(60, true),
      },
    }),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: GlobalStyles.colors.textColor,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  buttons: {
    alignItems: "center",
    flexDirection: i18n.locale !== "en" ? "column" : "row",
    justifyContent: "center",
    marginTop: dynamicScale(16, true),
  },
  container: {
    // flex: 1,
    // backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  secondaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "300",
    paddingHorizontal: dynamicScale(6),
    paddingVertical: dynamicScale(8, true),
  },
});
