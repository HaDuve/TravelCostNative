import { useContext, useEffect } from "react";
import { View, Alert, StyleSheet, Platform } from "react-native";
import React from "react";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import { UserContext } from "../../store/user-context";
import { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";
import { NetworkContext } from "../../store/network-context";
import IconButton from "../UI/IconButton";
import { i18n } from "../../i18n/i18n";
import { fetchChangelog } from "../../util/http";
import { asyncStoreSafeClear } from "../../store/async-storage";
import { getMMKVString, MMKV_KEYS } from "../../store/mmkv";
import { dynamicScale } from "../../util/scalingUtil";
import { ProfileToolbarTokens } from "../../styles/profile-toolbar-tokens";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";

type ProfileToolbarProps = {
  navigation: { navigate: (screen: string, params?: object) => void };
  setIsFetchingLogout: (value: boolean) => void;
};

const ProfileToolbar = ({
  navigation,
  setIsFetchingLogout,
}: ProfileToolbarProps) => {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const expCtx = useContext(ExpensesContext);
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.strongConnection;
  const freshlyCreated = userCtx.freshlyCreated;
  const hasNewChanges = userCtx.hasNewChanges;

  function logoutHandler() {
    return Alert.alert(i18n.t("sure"), i18n.t("signOutAlertMess"), [
      { text: i18n.t("no") },
      {
        text: i18n.t("yes"),
        onPress: async () => {
          trackEvent(VexoEvents.LOGOUT_PRESSED);
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

  useEffect(() => {
    async function checkNewChanges() {
      if (!isConnected) return;
      const newestChangelog = await fetchChangelog();
      if (!newestChangelog) return;
      userCtx.setHasNewChanges(true);
      const oldChangelog = getMMKVString(MMKV_KEYS.CHANGELOG_TXT);
      if (oldChangelog == newestChangelog) userCtx.setHasNewChanges(false);
    }
    checkNewChanges();
  }, [isConnected]);

  return (
    <View
      testID="profile-floating-toolbar"
      pointerEvents="box-none"
      style={styles.toolbarShell}
    >
      <View testID="profile-toolbar-chrome" style={styles.toolbarChrome}>
        <View testID="profile-toolbar-buttons" style={styles.toolbarButtons}>
          {!freshlyCreated && (
            <IconButton
              icon="newspaper-outline"
              size={ProfileToolbarTokens.iconSize}
              buttonStyle={styles.iconButton}
              color={GlobalStyles.colors.textColor}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Changelog");
                userCtx.setHasNewChanges(false);
              }}
              badge={hasNewChanges}
              badgeStyle={{ backgroundColor: GlobalStyles.colors.error500 }}
            />
          )}
          {!freshlyCreated && (
            <IconButton
              icon="settings-outline"
              size={ProfileToolbarTokens.iconSize}
              buttonStyle={styles.iconButton}
              color={GlobalStyles.colors.textColor}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Settings");
              }}
            />
          )}
          <IconButton
            icon="exit-outline"
            size={ProfileToolbarTokens.iconSize}
            buttonStyle={styles.iconButton}
            color={GlobalStyles.colors.textColor}
            onPress={logoutHandler}
          />
        </View>
      </View>
    </View>
  );
};

export default ProfileToolbar;

ProfileToolbar.propTypes = {
  navigation: PropTypes.object,
  setIsFetchingLogout: PropTypes.func,
};

const styles = StyleSheet.create({
  toolbarShell: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  toolbarChrome: {
    minHeight: ProfileToolbarTokens.chromeHeight,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    paddingBottom: ProfileToolbarTokens.paddingVertical,
    paddingHorizontal: ProfileToolbarTokens.paddingHorizontal,
    ...shadowRegressionStyles.headerBarShadow,
  },
  toolbarButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: ProfileToolbarTokens.contentHeight,
    gap: dynamicScale(2, false, 0.5),
  },
  iconButton: {
    padding: ProfileToolbarTokens.iconHitPadding,
    borderRadius: ProfileToolbarTokens.iconSize,
  },
});
