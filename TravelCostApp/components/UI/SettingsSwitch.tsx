import { StyleSheet, Switch, Text, View } from "react-native";
import React, { useState, useContext } from "react";
import PropTypes from "prop-types";
import { UserContext } from "../../store/user-context";
import GradientButton from "./GradientButton";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalStyles } from "../../constants/styles";
import { useEffect } from "react";

const SettingsSwitch = ({ style, setting, label }) => {
  const userContext = useContext(UserContext);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    async function loadSetting() {
      const settingState = await userContext.getSettingState(setting);
      setIsEnabled(settingState);
    }
    loadSetting();
  }, []);

  const toggleSwitch = async () => {
    await userContext.setSettingState(setting, !isEnabled);
    setIsEnabled(!isEnabled);
  };

  return (
    <View style={[style, styles.container]}>
      {/* <LinearGradient
        start={{ x: 0.51, y: -1.3 }}
        colors={GlobalStyles.gradientPrimaryButton}
        style={[{ overflow: "hidden" }]}
      > */}
      <Text style={styles.label}>{label}</Text>
      <Switch
        trackColor={{
          false: GlobalStyles.colors.gray500,
          true: GlobalStyles.colors.primary400,
        }}
        thumbColor={
          isEnabled
            ? GlobalStyles.colors.backgroundColor
            : GlobalStyles.colors.gray500Accent
        }
        onValueChange={toggleSwitch}
        value={isEnabled}
        style={[{ marginBottom: 8 }, GlobalStyles.shadowPrimary]}
      />
      {/* </LinearGradient> */}
    </View>
  );
};
export default SettingsSwitch;

SettingsSwitch.propTypes = {
  setting: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "4%",
    // add seperators and spacing like a professional settings page
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray500,
    marginBottom: 16,
  },
  label: {
    color: GlobalStyles.colors.textColor,
    fontSize: 16,
    marginBottom: 16,
  },
});
