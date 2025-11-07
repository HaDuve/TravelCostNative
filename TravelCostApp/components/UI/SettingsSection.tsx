import React, { useContext, useState } from "react";
import { View, StyleSheet } from "react-native";

import { i18n } from "../../i18n/i18n";

import { SettingsContext } from "../../store/settings-context";
import SettingsSwitch from "./SettingsSwitch";
import PropTypes from "prop-types";
import { secureStoreGetItem } from "../../store/secure-storage";
import safeLogError from "../../util/error";
import { safelyParseJSON } from "../../util/jsonParse";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import InfoButton from "./InfoButton";
import TrafficLightInfoModal from "./TrafficLightInfoModal";

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
  const [trafficLightBudgetColors, setTrafficLightBudgetColors] = useState(
    settings.trafficLightBudgetColors
  );
  const [showTrafficLightInfo, setShowTrafficLightInfo] = useState(false);

  const toggleShowFlags = () => {
    const newValue = !showFlags;
    const newSettings = { ...settings, showFlags: newValue };
    setShowFlags(newValue);
    saveSettings(newSettings);
    trackEvent(VexoEvents.SHOW_FLAGS_TOGGLE_CHANGED, { enabled: newValue });
  };

  const toggleShowWhoPaid = () => {
    const newValue = !showWhoPaid;
    const newSettings = { ...settings, showWhoPaid: newValue };
    setShowWhoPaid(newValue);
    saveSettings(newSettings);
    trackEvent(VexoEvents.SHOW_WHO_PAID_TOGGLE_CHANGED, { enabled: newValue });
  };

  const toggleAlwaysShowAdvanced = () => {
    const newValue = !alwaysShowAdvanced;
    const newSettings = {
      ...settings,
      alwaysShowAdvanced: newValue,
    };
    setAlwaysShowAdvanced(newValue);
    saveSettings(newSettings);
    trackEvent(VexoEvents.ALWAYS_SHOW_ADVANCED_TOGGLE_CHANGED, {
      enabled: newValue,
    });
  };
  const toggleSkipCategoryPickScreen = () => {
    const newValue = !skipCategoryPickScreen;
    const newSettings = {
      ...settings,
      skipCategoryScreen: newValue,
    };
    setSkipCategoryPickScreen(newValue);
    saveSettings(newSettings);
    trackEvent(VexoEvents.SKIP_CATEGORY_SCREEN_TOGGLE_CHANGED, {
      enabled: newValue,
    });
  };
  const toggleShowInternetSpeed = () => {
    const newValue = !showInternetSpeed;
    const newSettings = {
      ...settings,
      showInternetSpeed: newValue,
    };
    setShowInternetSpeed(newValue);
    saveSettings(newSettings);
    trackEvent(VexoEvents.SHOW_INTERNET_SPEED_TOGGLE_CHANGED, {
      enabled: newValue,
    });
  };
  const toggleHideSpecialExpenses = () => {
    const newValue = !hideSpecialExpenses;
    const newSettings = {
      ...settings,
      hideSpecialExpenses: newValue,
    };
    setHideSpecialExpenses(newValue);
    saveSettings(newSettings);
    trackEvent(VexoEvents.HIDE_SPECIAL_EXPENSES_TOGGLE_CHANGED, {
      enabled: newValue,
    });
  };
  const toggleDisableNumberAnimations = () => {
    const newValue = !disableNumberAnimations;
    const newSettings = {
      ...settings,
      disableNumberAnimations: newValue,
    };
    setDisableNumberAnimations(newValue);
    saveSettings(newSettings);
    trackEvent(VexoEvents.DISABLE_NUMBER_ANIMATIONS_TOGGLE_CHANGED, {
      enabled: newValue,
    });
  };
  const toggleTrafficLightBudgetColors = () => {
    const newValue = !trafficLightBudgetColors;
    const newSettings = {
      ...settings,
      trafficLightBudgetColors: newValue,
    };
    setTrafficLightBudgetColors(newValue);
    saveSettings(newSettings);
    trackEvent(VexoEvents.TRAFFIC_LIGHT_BUDGET_COLORS_TOGGLE_CHANGED, {
      enabled: newValue,
    });
  };
  return (
    <View>
      {/* <View style={styles.switchContainer}>
        <Text style={GlobalStyles.secondaryText}>Show Flags icons</Text>
        <Switch onValueChange={toggleShowFlags} value={showFlags} /> */}
      <SettingsSwitch
        label={i18n.t("settingsTrafficLightBudgetColors")}
        style={styles.switchContainer}
        state={trafficLightBudgetColors}
        toggleState={toggleTrafficLightBudgetColors}
        labelStyle={{}}
        infoButton={
          <InfoButton
            containerStyle={styles.infoButton}
            onPress={() => setShowTrafficLightInfo(true)}
          />
        }
      />
      <TrafficLightInfoModal
        isVisible={showTrafficLightInfo}
        onClose={() => setShowTrafficLightInfo(false)}
      />
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
  switchWithInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: "10%",
    marginVertical: "4%",
  },
  infoButton: {
    marginLeft: 8,
    marginBottom: 6,
    marginRight: 12,
  },
});
