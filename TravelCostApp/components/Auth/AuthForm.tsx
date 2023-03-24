import React, { useState } from "react";
import { StyleSheet, View, Text, Image, Pressable, Alert } from "react-native";
import { GlobalStyles } from "../../constants/styles";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Button from "../UI/Button";
import Input from "./Input";
import * as AppleAuthentication from "expo-apple-authentication";
import Toast from "react-native-toast-message";

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

  function appleAuth(credentials) {
    console.log("appleAuth");
    onSubmit(credentials, true);
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
            isInvalid={nameIsInvalid}
          />
        )}
        <Input
          label={i18n.t("emailLabel")}
          onUpdateValue={updateInputValueHandler.bind(this, "email")}
          value={enteredEmail}
          keyboardType="email-address"
          isInvalid={emailIsInvalid}
        />

        <Input
          label={i18n.t("passwordLabel")}
          onUpdateValue={updateInputValueHandler.bind(this, "password")}
          secure
          value={enteredPassword}
          isInvalid={passwordIsInvalid}
        />

        <View style={styles.buttons}>
          <Button onPress={submitHandler} style>
            {isLogin ? i18n.t("loginText") : i18n.t("createAccountText")}
          </Button>
        </View>
        <View style={styles.orTextContainer}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
            }
            cornerRadius={5}
            style={{ width: 200, height: 44 }}
            onPress={async () => {
              try {
                const credential = await AppleAuthentication.signInAsync({
                  requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                  ],
                });
                console.log("onPress={ ~ credential:", credential);
                Toast.show({
                  type: "success",
                  text1: "Apple Sign In",
                  text2:
                    credential.fullName.givenName +
                    " " +
                    credential.fullName.familyName +
                    " " +
                    credential.email,
                });
                appleAuth(credential);
                // signed in
              } catch (e) {
                if (e.code === "ERR_REQUEST_CANCELED") {
                  // handle that the user canceled the sign-in flow
                  console.log("onPress={ ~ e:", e);
                  Toast.show({
                    type: "error",
                    text1: "Apple Sign In",
                    text2: "User canceled the sign-in flow",
                  });
                } else {
                  // handle other errors
                  console.log("onPress={ ~ e:", e);
                  Toast.show({
                    type: "error",
                    text1: "Apple Sign In",
                    text2: e.message,
                  });
                }
              }
            }}
          />
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
