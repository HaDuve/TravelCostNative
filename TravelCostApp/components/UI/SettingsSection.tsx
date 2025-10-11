import React, { useContext, useState } from "react";
import { View, StyleSheet } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { SettingsContext } from "../../store/settings-context";
import SettingsSwitch from "./SettingsSwitch";
import PropTypes from "prop-types";
import { secureStoreGetItem } from "../../store/secure-storage";
import safeLogError from "../../util/error";
import { safelyParseJSON } from "../../util/jsonParse";

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
  const [disableNumberAnimations, setDisableNumberAnimations] = useState(
    settings.disableNumberAnimations
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
  const toggleDisableNumberAnimations = () => {
    const newSettings = {
      ...settings,
      disableNumberAnimations: !disableNumberAnimations,
    };
    setDisableNumberAnimations(!disableNumberAnimations);
    saveSettings(newSettings);
  };
  return (
    <View>
      {/* <View style={styles.switchContainer}>
        <Text style={GlobalStyles.secondaryText}>Show Flags icons</Text>
        <Switch onValueChange={toggleShowFlags} value={showFlags} /> */}
      <SettingsSwitch
        label={i18n.t("hideSpecialExpenses")}
        style={styles.switchContainer}
        state={hideSpecialExpenses}
        toggleState={toggleHideSpecialExpenses}
        labelStyle={{}}
      />
      <SettingsSwitch
        label={i18n.t("settingsDisableNumberAnimations")}
        style={styles.switchContainer}
        state={disableNumberAnimations}
        toggleState={toggleDisableNumberAnimations}
        labelStyle={{}}
      />
      <SettingsSwitch
        label={i18n.t("settingsSkipCat")}
        style={styles.switchContainer}
        state={skipCategoryPickScreen}
        toggleState={toggleSkipCategoryPickScreen}
        labelStyle={{}}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowAdvanced")}
        style={styles.switchContainer}
        state={alwaysShowAdvanced}
        toggleState={toggleAlwaysShowAdvanced}
        labelStyle={{}}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowFlags")}
        style={styles.switchContainer}
        state={showFlags}
        toggleState={toggleShowFlags}
        labelStyle={{}}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowInternetSpeed")}
        style={styles.switchContainer}
        state={showInternetSpeed}
        toggleState={toggleShowInternetSpeed}
        labelStyle={{}}
      />
      {multiTraveller && (
        <SettingsSwitch
          label={i18n.t("settingsShowTravellerIcon")}
          style={styles.switchContainer}
          state={showWhoPaid}
          toggleState={toggleShowWhoPaid}
          labelStyle={{}}
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
    return safelyParseJSON(settings);
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
