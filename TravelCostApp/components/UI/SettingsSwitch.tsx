import { StyleSheet, Switch, Text, View } from "react-native";
import React from "react";
import PropTypes from "prop-types";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalStyles } from "../../constants/styles";

const SettingsSwitch = ({ style, toggleState, state, label }) => {
  return (
    <View style={[styles.container, style]}>
      {/* <LinearGradient
        start={{ x: 0.51, y: -1.3 }}
        colors={GlobalStyles.gradientPrimaryButton}
        style={[{ overflow: "hidden" }]}
      > */}
      <Text style={GlobalStyles.secondaryText}>{label}</Text>
      <Switch
        trackColor={{
          false: GlobalStyles.colors.gray500,
          true: GlobalStyles.colors.primary400,
        }}
        thumbColor={
          state
            ? GlobalStyles.colors.backgroundColor
            : GlobalStyles.colors.gray500Accent
        }
        onValueChange={toggleState}
        value={state}
        style={[{ marginBottom: 8 }, GlobalStyles.shadowPrimary]}
      />
      {/* </LinearGradient> */}
    </View>
  );
};
export default SettingsSwitch;

SettingsSwitch.propTypes = {
  style: PropTypes.object,
  toggleState: PropTypes.func.isRequired,
  state: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "4%",
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray500,
    marginBottom: "2%",
  },
  label: {
    color: GlobalStyles.colors.textColor,
    fontSize: 16,
    marginBottom: 16,
  },
});
