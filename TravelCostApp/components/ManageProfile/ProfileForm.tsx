/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
import { useState, useContext } from "react";
import { View, Text, Alert, Keyboard, Pressable } from "react-native";
import React, { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { UserContext, UserData } from "../../store/user-context";
import { updateUser } from "../../util/http";

import Input from "../ManageExpense/Input";
import IconButton from "../UI/IconButton";
import Button from "../UI/Button";
import { TripContext } from "../../store/trip-context";
import FlatButton from "../UI/FlatButton";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import LoadingOverlay from "../UI/LoadingOverlay";
import GradientButton from "../UI/GradientButton";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ProfileForm = ({ navigation }) => {
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const TripCtx = useContext(TripContext);
  const freshlyCreated = UserCtx.freshlyCreated;
  const [isFetchingLogout, setIsFetchingLogout] = useState(false);

  function logoutHandler() {
    return Alert.alert(i18n.t("sure"), i18n.t("signOutAlertMess"), [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: i18n.t("no"),
      },
      // The "Yes" button
      {
        text: i18n.t("yes"),
        onPress: () => {
          setIsFetchingLogout(true);
          TripCtx.setCurrentTrip("reset", "null");
          AuthCtx.logout();
          setIsFetchingLogout(false);
        },
      },
    ]);
  }
  const iconButtonJSX = isFetchingLogout ? (
    <LoadingOverlay></LoadingOverlay>
  ) : (
    <View style={[styles.inputsRow, { marginTop: -12 }]}>
      <IconButton
        icon={"settings-outline"}
        size={36}
        color={GlobalStyles.colors.textColor}
        // style={styles.button}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate("Settings");
        }}
      />
      <IconButton
        icon={"exit-outline"}
        size={36}
        color={GlobalStyles.colors.textColor}
        // style={styles.button}
        onPress={logoutHandler}
      />
    </View>
  );

  const [inputs, setInputs] = useState({
    userName: {
      value: !UserCtx.userName ? "" : UserCtx.userName,
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

  async function submitHandler() {
    const userData: UserData = { userName: "" };
    userData.userName = inputs.userName.value;

    const invalid =
      userData.userName.length == 0 || userData.userName.length > 20;

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
      Alert.alert(i18n.t("profileError"));
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

  function avatarHandler() {
    return;
    Alert.alert("Profile picture function coming soon... ");
  }

  const changedName = inputs.userName.value !== UserCtx.userName;
  const changedNameButtons = (
    <View style={styles.buttonContainer}>
      <IconButton
        icon={"close-outline"}
        size={36}
        color={GlobalStyles.colors.accent500}
        onPress={cancelHandler}
      />
      <IconButton
        icon={"checkmark"}
        size={36}
        color={GlobalStyles.colors.primary500}
        onPress={submitHandler}
      />
    </View>
  );

  function joinInviteHandler() {
    navigation.navigate("Join");
  }

  const freshlyNavigationButtons = freshlyCreated && (
    <View style={styles.navButtonContainer}>
      <FlatButton
        // style={styles.navButton}
        onPress={joinInviteHandler}
      >
        {i18n.t("invitationText")}
      </FlatButton>
      <GradientButton
        style={styles.navButton}
        onPress={() => navigation.navigate("ManageTrip")}
      >
        {i18n.t("createFirstTrip")}
      </GradientButton>
    </View>
  );

  return (
    <View style={styles.form}>
      <View style={styles.avatarBar}>
        <Pressable onPress={avatarHandler}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {inputs.userName.value.charAt(0)}
            </Text>
          </View>
        </Pressable>
        <View style={styles.nameRow}>
          <Text style={styles.userText}>{inputs.userName.value}</Text>
        </View>
        <View style={styles.logoutContainer}>{iconButtonJSX}</View>
      </View>
      <View style={styles.inputsRow}></View>
      {changedName && changedNameButtons}
      {freshlyNavigationButtons}
    </View>
  );
};

export default ProfileForm;

ProfileForm.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  form: {
    flex: 1,
    marginTop: "2%",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    maxWidth: "40%",
  },
  avatarBar: {
    marginTop: "2%",
    marginHorizontal: "4%",
    padding: "1%",
    minHeight: "20%",
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
  userText: {
    fontSize: 24,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
  logoutContainer: {
    marginBottom: "-4%",
    alignItems: "flex-end",
    justifyContent: "flex-end",
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
    padding: 4,
    marginBottom: 8,
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
