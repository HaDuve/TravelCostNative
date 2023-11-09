import React, { useContext, useState } from "react";
import { View, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { SettingsContext } from "../../store/settings-context";
import SettingsSwitch from "./SettingsSwitch";
import PropTypes from "prop-types";
import { secureStoreGetItem } from "../../store/secure-storage";
import safeLogError from "../../util/error";

const SettingsSection = ({ multiTraveller }) => {
  const { settings, saveSettings } = useContext(SettingsContext);
  const [showFlags, setShowFlags] = useState(settings.showFlags);
  const [showWhoPaid, setShowWhoPaid] = useState(settings.showWhoPaid);
  const [alwaysShowAdvanced, setAlwaysShowAdvanced] = useState(
    settings.alwaysShowAdvanced
  );
  const [skipCategoryPickScreen, setSkipCategoryPickScreen] = useState(
    settings.skipCategoryScreen
  );
  const [showInternetSpeed, setShowInternetSpeed] = useState(
    settings.showInternetSpeed
  );
  const [hideSpecialExpenses, setHideSpecialExpenses] = useState(
    settings.hideSpecialExpenses
  );

  const toggleShowFlags = () => {
    const newSettings = { ...settings, showFlags: !showFlags };
    setShowFlags(!showFlags);
    saveSettings(newSettings);
  };

  const toggleShowWhoPaid = () => {
    const newSettings = { ...settings, showWhoPaid: !showWhoPaid };
    setShowWhoPaid(!showWhoPaid);
    saveSettings(newSettings);
  };

  const toggleAlwaysShowAdvanced = () => {
    const newSettings = {
      ...settings,
      alwaysShowAdvanced: !alwaysShowAdvanced,
    };
    setAlwaysShowAdvanced(!alwaysShowAdvanced);
    saveSettings(newSettings);
  };
  const toggleSkipCategoryPickScreen = () => {
    const newSettings = {
      ...settings,
      skipCategoryScreen: !skipCategoryPickScreen,
    };
    setSkipCategoryPickScreen(!skipCategoryPickScreen);
    saveSettings(newSettings);
  };
  const toggleShowInternetSpeed = () => {
    const newSettings = {
      ...settings,
      showInternetSpeed: !showInternetSpeed,
    };
    setShowInternetSpeed(!showInternetSpeed);
    saveSettings(newSettings);
  };
  const toggleHideSpecialExpenses = () => {
    const newSettings = {
      ...settings,
      hideSpecialExpenses: !hideSpecialExpenses,
    };
    setHideSpecialExpenses(!hideSpecialExpenses);
    saveSettings(newSettings);
  };
  return (
    <View>
      {/* <View style={styles.switchContainer}>
        <Text style={GlobalStyles.secondaryText}>Show Flags icons</Text>
        <Switch onValueChange={toggleShowFlags} value={showFlags} /> */}
      <SettingsSwitch
        label={"Hide special expenses"}
        style={styles.switchContainer}
        state={hideSpecialExpenses}
        toggleState={toggleHideSpecialExpenses}
      />
      <SettingsSwitch
        label={i18n.t("settingsSkipCat")}
        style={styles.switchContainer}
        state={skipCategoryPickScreen}
        toggleState={toggleSkipCategoryPickScreen}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowAdvanced")}
        style={styles.switchContainer}
        state={alwaysShowAdvanced}
        toggleState={toggleAlwaysShowAdvanced}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowFlags")}
        style={styles.switchContainer}
        state={showFlags}
        toggleState={toggleShowFlags}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowInternetSpeed")}
        style={styles.switchContainer}
        state={showInternetSpeed}
        toggleState={toggleShowInternetSpeed}
      />
      {multiTraveller && (
        <SettingsSwitch
          label={i18n.t("settingsShowTravellerIcon")}
          style={styles.switchContainer}
          state={showWhoPaid}
          toggleState={toggleShowWhoPaid}
        />
      )}
    </View>
  );
};

export default SettingsSection;

SettingsSection.propTypes = {
  multiTraveller: PropTypes.bool,
};

export const loadSettings = async () => {
  try {
    const settings = await secureStoreGetItem("settings");
    return JSON.parse(settings);
  } catch (error) {
    safeLogError(error);
    return {};
  }
};

const styles = StyleSheet.create({
  switchContainer: {
    marginHorizontal: "10%",
    marginVertical: "4%",
    justifyContent: "space-between",
    flexDirection: "row",
  },
});
