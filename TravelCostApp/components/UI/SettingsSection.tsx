import React, { useContext, useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SettingsContext } from "../../store/settings-context";
import { GlobalStyles } from "../../constants/styles";
import SettingsSwitch from "./SettingsSwitch";

const SettingsSection = () => {
  const { settings, saveSettings } = useContext(SettingsContext);
  const [showFlags, setShowFlags] = useState(settings.showFlags);
  const [showWhoPaid, setShowWhoPaid] = useState(settings.showWhoPaid);

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

  return (
    <View>
      {/* <View style={styles.switchContainer}>
        <Text style={GlobalStyles.secondaryText}>Show Flags icons</Text>
        <Switch onValueChange={toggleShowFlags} value={showFlags} /> */}
      <SettingsSwitch
        label="Show Flags icons"
        style={styles.switchContainer}
        state={showFlags}
        toggleState={toggleShowFlags}
      />
      <SettingsSwitch
        label="Show Traveller icons"
        style={styles.switchContainer}
        state={showWhoPaid}
        toggleState={toggleShowWhoPaid}
      />
    </View>
  );
};

export default SettingsSection;

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
