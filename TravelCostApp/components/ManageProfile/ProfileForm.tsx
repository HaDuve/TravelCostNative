/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
import { useState, useContext, useEffect } from "react";
import { View, Text, Alert, Pressable } from "react-native";
import React, { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { UserContext } from "../../store/user-context";
import { fetchChangelog } from "../../util/http";

import IconButton from "../UI/IconButton";
import { TripContext } from "../../store/trip-context";
import FlatButton from "../UI/FlatButton";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import GradientButton from "../UI/GradientButton";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import { ExpensesContext } from "../../store/expenses-context";
import { asyncStoreSafeClear } from "../../store/async-storage";
import { getMMKVString } from "../../store/mmkv";
import { NetworkContext } from "../../store/network-context";
import { OrientationContext } from "../../store/orientation-context";
import {
  dynamicScale,
  moderateScale,
  scale,
  verticalScale,
} from "../../util/scalingUtil";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ProfileForm = ({ navigation, setIsFetchingLogout }) => {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const expCtx = useContext(ExpensesContext);
  const netCtx = useContext(NetworkContext);
  const { isPortrait } = useContext(OrientationContext);
  const isConnected = netCtx.strongConnection;
  const freshlyCreated = userCtx.freshlyCreated;

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
        onPress: async () => {
          setIsFetchingLogout(true);
          await tripCtx.setCurrentTrip("reset", null);
          expCtx.setExpenses([]);
          userCtx.setTripHistory([]);
          await userCtx.setUserName("");
          await asyncStoreSafeClear();
          authCtx.logout();
          setIsFetchingLogout(false);
        },
      },
    ]);
  }

  // new changes button
  const hasNewChanges = userCtx.hasNewChanges;
  useEffect(() => {
    async function checkNewChanges() {
      if (!isConnected) return;
      const newestChangelog = await fetchChangelog();
      if (!newestChangelog) return;
      userCtx.setHasNewChanges(true);
      const oldChangelog = getMMKVString("changelog.txt");
      if (oldChangelog == newestChangelog) userCtx.setHasNewChanges(false);
    }
    checkNewChanges();
  }, [isConnected]);
  const iconButtonJSX = (
    <View style={[styles.inputsRow, { marginTop: verticalScale(-12) }]}>
      {/* TODO: add a "new changes" button that parses the changelog, if it has new changes, will show a "!"-badge */}
      {!freshlyCreated && (
        <IconButton
          icon={"newspaper-outline"}
          size={moderateScale(36)}
          color={GlobalStyles.colors.textColor}
          // style={styles.button}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Changelog");
            userCtx.setHasNewChanges(false);
          }}
          badge={hasNewChanges}
          // badgeText={"!"}
          badgeStyle={{ backgroundColor: GlobalStyles.colors.error500 }}
        />
      )}

      {!freshlyCreated && (
        <IconButton
          icon={"settings-outline"}
          size={moderateScale(36)}
          color={GlobalStyles.colors.textColor}
          // style={styles.button}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Settings");
          }}
        />
      )}
      <IconButton
        icon={"exit-outline"}
        size={moderateScale(36)}
        color={GlobalStyles.colors.textColor}
        // style={styles.button}
        onPress={logoutHandler}
      />
    </View>
  );

  const [inputs, setInputs] = useState({
    userName: {
      value: !userCtx.userName ? "" : userCtx.userName,
      isValid: true,
    },
  });

  useEffect(() => {
    setInputs((curInputs) => {
      return {
        ...curInputs,
        ["userName"]: { value: userCtx.userName, isValid: true },
      };
    });
  }, [userCtx.userName]);

  function avatarHandler() {
    return;
  }

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
      {userCtx.freshlyCreated && (
        <View style={styles.welcomeTextBar}>
          <Text style={styles.welcomeText}>
            {`Welcome ${inputs.userName.value}!`}
          </Text>
        </View>
      )}
      <View style={styles.avatarBar}>
        <Pressable onPress={avatarHandler}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {inputs.userName.value?.charAt(0)}
            </Text>
          </View>
        </Pressable>
        <View style={styles.nameRow}>
          <Text style={styles.userText}>{inputs.userName.value}</Text>
        </View>
        <View style={styles.logoutContainer}>{iconButtonJSX}</View>
      </View>
      <View style={styles.inputsRow}></View>
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
    marginTop: verticalScale(8),
    maxHeight: verticalScale(30),
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    maxWidth: dynamicScale(100),
  },
  welcomeTextBar: {
    marginTop: verticalScale(8),
    marginHorizontal: dynamicScale(15),
    padding: dynamicScale(4),
    minHeight: verticalScale(50),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: moderateScale(36),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
  avatarBar: {
    marginTop: verticalScale(10),
    marginHorizontal: dynamicScale(15),
    padding: dynamicScale(4),
    minHeight: verticalScale(30),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    minHeight: moderateScale(60),
    minWidth: moderateScale(60),
    borderRadius: moderateScale(60),
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: moderateScale(36),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
  userText: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
  logoutContainer: {
    marginBottom: verticalScale(-16),
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: GlobalStyles.colors.backgroundColor,
    marginTop: verticalScale(5),
    marginBottom: verticalScale(24),
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
    margin: dynamicScale(8),
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    margin: verticalScale(8),
    minHeight: verticalScale(100),
  },
  navButtonContainer: {
    flex: 1,
    minHeight: verticalScale(150),
    justifyContent: "flex-end",
    alignContent: "flex-end",
    padding: verticalScale(4),
    marginVertical: verticalScale(8),
    marginTop: verticalScale(36),
  },
  navButton: {
    minWidth: dynamicScale(120),
    marginVertical: verticalScale(8),
    marginTop: verticalScale(36),
  },
  button: {
    minWidth: dynamicScale(120),
    marginHorizontal: dynamicScale(8),
  },
});
