import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { GlobalStyles } from "../../constants/styles";

import { i18n } from "../../i18n/i18n";

import Input from "./Input";
import PropTypes from "prop-types";
import GradientButton from "../UI/GradientButton";
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../../store/secure-storage";
import {
  dynamicScale,
} from "../../util/scalingUtil";

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

  // async function appleAuth(
  //   credentials: AppleAuthentication.AppleAuthenticationCredential
  // ) {
  //   let appleEmail = "";
  //   if (credentials.email !== null) {
  //     await asyncStoreSetItem(
  //       "@userEmail" + credentials.user,
  //       credentials.email
  //     );
  //     appleEmail = credentials.email;
  //   } else {
  //     const storedMail = await asyncStoreGetItem(
  //       "@userEmail" + credentials.user
  //     );
  //     if (storedMail !== null) {
  //       appleEmail = storedMail;
  //     } else {
  //       Toast.show({
  //         type: "error",
  //         text1: i18n.t("toastEmailError1"),
  //         text2: i18n.t("toastEmailError2"),
  //       });
  //       return;
  //     }
  //   }
  //   const name =
  //     credentials.fullName.givenName + " " + credentials.fullName.familyName;
  //   const password = credentials.user.slice(0, 20) + "@apple.com.p4sW0r-_d";
  //   const newCredentials = {
  //     name: name,
  //     email: appleEmail,
  //     password: password,
  //   };
  //   await onSubmit(newCredentials);
  // }

  // NOTE: Keep this code in case Apple Auth is reimplemented
  // const AppleAuthenticationJSX = (
  //   <AppleAuthentication.AppleAuthenticationButton
  //     buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  //     buttonStyle={
  //       AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
  //     }
  //     cornerRadius={5}
  //     style={{ width: 200, height: 44 }}
  //     onPress={async () => {
  //       let credentials: AppleAuthentication.AppleAuthenticationCredential;
  //       try {
  //         credentials = await AppleAuthentication.signInAsync({
  //           requestedScopes: [
  //             AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
  //             AppleAuthentication.AppleAuthenticationScope.EMAIL,
  //           ],
  //         });
  //         // signed in
  //       } catch (e) {
  //         if (e.code === "ERR_REQUEST_CANCELED") {
  //           // handle that the user canceled the sign-in flow
  //           Toast.show({
  //             type: "error",
  //             text1: i18n.t("toastAppleError1"),
  //             text2: i18n.t("toastAppleError2"),
  //           });
  //         } else {
  //           // handle other errors
  //           Toast.show({
  //             type: "error",
  //             text1: i18n.t("toastAppleError1"),
  //             text2: e.message,
  //           });
  //         }
  //       }
  //       await appleAuth(credentials);
  //     }}
  //   />
  // );

  return (
    <View style={styles.form}>
      <View>
        <View style={styles.iconContainer}>
          <Image
            source={require("../../assets/icon2.png")}
            style={{
              width: dynamicScale(60, false, 0.5),
              height: dynamicScale(60, false, 0.5),
            }}
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
    marginTop: dynamicScale(12),
  },
  iconContainer: {
    marginTop: dynamicScale(-30, true),
    marginBottom: dynamicScale(10),
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
    fontSize: dynamicScale(28, false, 0.5),
    fontWeight: "bold",
    marginBottom: dynamicScale(12),
  },
  subTitleText: {
    textAlign: "center",
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(14, false, 0.5),
    marginBottom: dynamicScale(12),
  },
  appleAuthContainer: {
    marginTop: dynamicScale(16),
    justifyContent: "center",
    alignItems: "center",
  },
  orText: {
    fontSize: dynamicScale(12, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.gray600,
  },
  google: {
    marginTop: dynamicScale(12),
    margin: dynamicScale(4),
    padding: dynamicScale(8),
    paddingHorizontal: dynamicScale(32),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
    borderRadius: 8,
  },
  googleText: {
    fontSize: dynamicScale(18, false, 0.5),
    color: GlobalStyles.colors.textColor,
  },
});
