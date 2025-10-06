/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
import * as Haptics from "expo-haptics";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { useContext, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

//Localization

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import GradientButton from "../UI/GradientButton";

import { asyncStoreSafeClear } from "../../store/async-storage";
import { AuthContext } from "../../store/auth-context";
import { ExpensesContext } from "../../store/expenses-context";
import { getMMKVString } from "../../store/mmkv";
import { NetworkContext } from "../../store/network-context";
import { OrientationContext } from "../../store/orientation-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import { fetchChangelog } from "../../util/http";
import { dynamicScale } from "../../util/scalingUtil";
import FlatButton from "../UI/FlatButton";
import IconButton from "../UI/IconButton";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
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
          authCtx.logout(tripCtx.tripid);
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
    <View style={[styles.inputsRow, { marginTop: dynamicScale(-12, true) }]}>
      {/* TODO: add a "new changes" button that parses the changelog, if it has new changes, will show a "!"-badge */}
      {!freshlyCreated && (
        <IconButton
          icon={"newspaper-outline"}
          size={dynamicScale(36, false, 0.5)}
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
          size={dynamicScale(36, false, 0.5)}
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
        size={dynamicScale(36, false, 0.5)}
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
    setInputs(curInputs => {
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
      <FlatButton onPress={joinInviteHandler}>
        {i18n.t("invitationText")}
      </FlatButton>
      <GradientButton
        buttonStyle={{}}
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

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: dynamicScale(60, false, 0.5),
    justifyContent: "center",
    minHeight: dynamicScale(60, false, 0.5),
    minWidth: dynamicScale(60, false, 0.5),
  },
  avatarBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: dynamicScale(15),
    marginTop: dynamicScale(10, true),
    minHeight: dynamicScale(30, true),
    padding: dynamicScale(4),
  },
  avatarText: {
    color: GlobalStyles.colors.primary700,
    fontSize: dynamicScale(36, false, 0.5),
    fontWeight: "bold",
  },
  button: {
    marginHorizontal: dynamicScale(8),
    minWidth: dynamicScale(120),
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    margin: dynamicScale(8, true),
    minHeight: dynamicScale(100, true),
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  errorText: {
    color: GlobalStyles.colors.error500,
    margin: dynamicScale(8),
    textAlign: "center",
  },
  form: {
    flex: 1,
    marginTop: dynamicScale(8, true),
    maxHeight: dynamicScale(30, true),
  },
  inputStyle: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  inputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logoutContainer: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginBottom: dynamicScale(-16, true),
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    maxWidth: dynamicScale(100),
  },
  navButton: {
    marginTop: dynamicScale(36, true),
    marginVertical: dynamicScale(8, true),
    minWidth: dynamicScale(120),
  },
  navButtonContainer: {
    alignContent: "flex-end",
    flex: 1,
    justifyContent: "flex-end",
    marginTop: dynamicScale(36, true),
    marginVertical: dynamicScale(8, true),
    minHeight: dynamicScale(150, true),
    padding: dynamicScale(4, true),
  },
  rowInput: {
    flex: 1,
  },
  title: {
    color: GlobalStyles.colors.backgroundColor,
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "bold",
    marginBottom: dynamicScale(24, true),
    marginTop: dynamicScale(5, true),
    textAlign: "center",
  },
  userText: {
    color: GlobalStyles.colors.primary700,
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "bold",
  },
  welcomeText: {
    color: GlobalStyles.colors.primary700,
    fontSize: dynamicScale(36, false, 0.5),
    fontWeight: "bold",
  },
  welcomeTextBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: dynamicScale(15),
    marginTop: dynamicScale(8, true),
    minHeight: dynamicScale(50, true),
    padding: dynamicScale(4),
  },
});
