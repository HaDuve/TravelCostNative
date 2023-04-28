import React, { useContext, useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SettingsContext } from "../../store/settings-context";
import { GlobalStyles } from "../../constants/styles";
import SettingsSwitch from "./SettingsSwitch";
import PropTypes from "prop-types";

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
  return (
    <View>
      {/* <View style={styles.switchContainer}>
        <Text style={GlobalStyles.secondaryText}>Show Flags icons</Text>
        <Switch onValueChange={toggleShowFlags} value={showFlags} /> */}
      <SettingsSwitch
        label="Skip Category Picker"
        style={styles.switchContainer}
        state={skipCategoryPickScreen}
        toggleState={toggleSkipCategoryPickScreen}
      />
      <SettingsSwitch
        label="Always show more options"
        style={styles.switchContainer}
        state={alwaysShowAdvanced}
        toggleState={toggleAlwaysShowAdvanced}
      />
      <SettingsSwitch
        label="Show Flags icons"
        style={styles.switchContainer}
        state={showFlags}
        toggleState={toggleShowFlags}
      />
      {multiTraveller && (
        <SettingsSwitch
          label="Show Traveller icons"
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
    const settings = await AsyncStorage.getItem("settings");
    return JSON.parse(settings);
  } catch (error) {
    console.log(error);
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
