import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { GlobalStyles } from "../../constants/styles";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Input from "./Input";
import * as AppleAuthentication from "expo-apple-authentication";
import Toast from "react-native-toast-message";
import PropTypes from "prop-types";
import {
  asyncStoreGetItem,
  asyncStoreSetItem,
} from "../../store/async-storage";
import GradientButton from "../UI/GradientButton";
import { TextInput } from "react-native-paper";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { getMMKVString } from "../../store/mmkv";
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../../store/secure-storage";

function AuthForm({ isLogin, onSubmit, credentialsInvalid, isConnected }) {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredName, setenteredName] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");

  async function loadLastEmail() {
    const lastEmail = await secureStoreGetItem("lastEmail");
    if (lastEmail !== null) {
      setEnteredEmail(lastEmail);
    }
  }

  useEffect(() => {
    if (!isLogin) return;
    loadLastEmail();
  }, []);

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

  async function submitHandler() {
    await secureStoreSetItem("lastEmail", enteredEmail);
    await onSubmit({
      name: enteredName,
      email: enteredEmail,
      password: enteredPassword,
    });
  }

  async function appleAuth(
    credentials: AppleAuthentication.AppleAuthenticationCredential
  ) {
    let appleEmail = "";
    if (credentials.email !== null) {
      await asyncStoreSetItem(
        "@userEmail" + credentials.user,
        credentials.email
      );
      appleEmail = credentials.email;
    } else {
      const storedMail = await asyncStoreGetItem(
        "@userEmail" + credentials.user
      );
      if (storedMail !== null) {
        appleEmail = storedMail;
      } else {
        Toast.show({
          type: "error",
          text1: i18n.t("toastEmailError1"),
          text2: i18n.t("toastEmailError2"),
        });
        return;
      }
    }
    const name =
      credentials.fullName.givenName + " " + credentials.fullName.familyName;
    const password = credentials.user.slice(0, 20) + "@apple.com.p4sW0r-_d";
    const newCredentials = {
      name: name,
      email: appleEmail,
      password: password,
    };
    await onSubmit(newCredentials);
  }

  const AppleAuthenticationJSX = (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={
        AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
      }
      cornerRadius={5}
      style={{ width: 200, height: 44 }}
      onPress={async () => {
        let credentials: AppleAuthentication.AppleAuthenticationCredential;
        try {
          credentials = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          // signed in
        } catch (e) {
          if (e.code === "ERR_REQUEST_CANCELED") {
            // handle that the user canceled the sign-in flow
            console.log("onPress={ ~ e:", e);
            Toast.show({
              type: "error",
              text1: i18n.t("toastAppleError1"),
              text2: i18n.t("toastAppleError2"),
            });
          } else {
            // handle other errors
            console.log("onPress={ ~ e:", e);
            Toast.show({
              type: "error",
              text1: i18n.t("toastAppleError1"),
              text2: e.message,
            });
          }
        }
        await appleAuth(credentials);
      }}
    />
  );

  return (
    <View style={styles.form}>
      <View>
        <View style={styles.iconContainer}>
          <Image
            source={require("../../assets/icon2.png")}
            style={{ width: 60, height: 60 }}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            {isLogin ? i18n.t("loginText") : i18n.t("createAccountText")}
          </Text>
          <Text style={styles.subTitleText}>
            {isLogin
              ? i18n.t("welcomeSigninText")
              : i18n.t("welcomeCreateAccountText")}
          </Text>
        </View>

        {!isLogin && (
          <Input
            label={i18n.t("nameLabel")}
            onUpdateValue={updateInputValueHandler.bind(this, "name")}
            value={enteredName}
            secure={false}
            keyboardType="default"
            isInvalid={nameIsInvalid}
            isInvalidInfoText={i18n.t("nameInvalidInfoText")}
            textContentType="name"
          />
        )}
        <Input
          label={i18n.t("emailLabel")}
          onUpdateValue={updateInputValueHandler.bind(this, "email")}
          value={enteredEmail}
          secure={false}
          keyboardType="email-address"
          isInvalid={emailIsInvalid}
          isInvalidInfoText={i18n.t("emailInvalidInfoText")}
          textContentType="emailAddress"
        />

        <Input
          label={i18n.t("passwordLabel")}
          onUpdateValue={updateInputValueHandler.bind(this, "password")}
          secure
          keyboardType="default"
          value={enteredPassword}
          isInvalid={passwordIsInvalid}
          isInvalidInfoText={i18n.t("passwordInvalidInfoText")}
          textContentType="password"
        />

        <View style={styles.buttons}>
          <GradientButton
            colors={
              isConnected
                ? GlobalStyles.gradientPrimaryButton
                : [
                    GlobalStyles.colors.primary500,
                    GlobalStyles.colors.primaryGrayed,
                  ]
            }
            onPress={submitHandler}
          >
            {isLogin ? i18n.t("loginText") : i18n.t("createAccountText")}
          </GradientButton>
        </View>
        <View style={styles.appleAuthContainer}>
          {/* {AppleAuthenticationJSX} */}
          {/* <Pressable
            onPress={() => Alert.alert(i18n.t("signupComingSoonAlert"))}
          >
            <View style={styles.google}>
              <Text style={styles.googleText}>
                {i18n.t("signupGoogleText")}
              </Text>
            </View>
          </Pressable> */}
        </View>
      </View>
    </View>
  );
}

export default AuthForm;

AuthForm.propTypes = {
  isLogin: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  credentialsInvalid: PropTypes.object.isRequired,
  isConnected: PropTypes.bool,
};

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  buttons: {
    marginTop: 12,
  },
  iconContainer: {
    marginTop: "-12%",
    marginBottom: "4%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "space-around",
  },
  titleText: {
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: "4%",
  },
  subTitleText: {
    textAlign: "center",
    color: GlobalStyles.colors.gray700,
    fontSize: 14,
    marginBottom: "4%",
  },
  appleAuthContainer: {
    marginTop: "8%",
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
