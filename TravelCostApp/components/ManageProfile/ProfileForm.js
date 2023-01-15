/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
import { useState, useContext } from "react";
import { View, Text, Alert, Keyboard, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { UserContext } from "../../store/user-context";
import { updateUser } from "../../util/http";

import Input from "../ManageExpense/Input";
import IconButton from "../UI/IconButton";
import Button from "../UI/Button";
import { TripContext } from "../../store/trip-context";
import FlatButton from "../UI/FlatButton";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ProfileForm = ({ navigation }) => {
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const freshlyCreated = UserCtx.freshlyCreated;

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
    const userData = {};
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
    Alert.alert("Profile picture function coming soon... ");
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

  function joinInviteHandler() {
    navigation.navigate("Join");
  }

  const freshlyNavigationButtons = freshlyCreated && (
    <View style={styles.navButtonContainer}>
      <FlatButton style={[styles.navButton]} onPress={joinInviteHandler}>
        {i18n.t("invitationText")}
      </FlatButton>
      <Button
        style={styles.navButton}
        onPress={() => navigation.navigate("ManageTrip")}
      >
        {i18n.t("createFirstTrip")}
      </Button>
    </View>
  );
  return (
    <View style={styles.form}>
      <View style={styles.avatarBar}>
        <Pressable onPress={avatarHandler}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {/* TODO: Profile Picture for now replaced with first char of the name */}
              {inputs.userName.value.charAt(0)}
            </Text>
          </View>
        </Pressable>
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
          label={i18n.t("nameLabel")}
          style={styles.rowInput}
          inputStyle={styles.inputStyle}
          textInputConfig={{
            onChangeText: inputChangedHandler.bind(this, "userName"),
            value: inputs.userName.value,
          }}
          invalid={!inputs.userName.isValid}
          editable={false}
          selectTextOnFocus={false}
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
    marginTop: "6%",
    marginHorizontal: "3%",
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
