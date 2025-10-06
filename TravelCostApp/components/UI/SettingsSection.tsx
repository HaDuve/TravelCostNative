import { useContext, useState } from "react";
import { StyleSheet, View } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { secureStoreGetItem } from "../../store/secure-storage";
import { SettingsContext } from "../../store/settings-context";
import safeLogError from "../../util/error";
import { safelyParseJSON } from "../../util/jsonParse";

import SettingsSwitch from "./SettingsSwitch";

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
        label={i18n.t("hideSpecialExpenses")}
        style={styles.switchContainer}
        labelStyle={{}}
        state={hideSpecialExpenses}
        toggleState={toggleHideSpecialExpenses}
      />
      <SettingsSwitch
        label={i18n.t("settingsSkipCat")}
        style={styles.switchContainer}
        labelStyle={{}}
        state={skipCategoryPickScreen}
        toggleState={toggleSkipCategoryPickScreen}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowAdvanced")}
        style={styles.switchContainer}
        labelStyle={{}}
        state={alwaysShowAdvanced}
        toggleState={toggleAlwaysShowAdvanced}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowFlags")}
        style={styles.switchContainer}
        labelStyle={{}}
        state={showFlags}
        toggleState={toggleShowFlags}
      />
      <SettingsSwitch
        label={i18n.t("settingsShowInternetSpeed")}
        style={styles.switchContainer}
        labelStyle={{}}
        state={showInternetSpeed}
        toggleState={toggleShowInternetSpeed}
      />
      {multiTraveller && (
        <SettingsSwitch
          label={i18n.t("settingsShowTravellerIcon")}
          style={styles.switchContainer}
          labelStyle={{}}
          state={showWhoPaid}
          toggleState={toggleShowWhoPaid}
        />
      )}
    </View>
  );
};

export default SettingsSection;

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
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: "10%",
    marginVertical: "4%",
  },
});
