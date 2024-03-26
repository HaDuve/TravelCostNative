import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import React from "react";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";
import {
  dynamicScale,
  moderateScale,
  verticalScale,
} from "../../util/scalingUtil";

const SettingsSwitch = ({ style, toggleState, state, label, labelStyle }) => {
  return (
    <Pressable onPress={() => toggleState()} style={[styles.container, style]}>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            {
              fontSize: dynamicScale(14, false, 0.5),
              color: "#626262",
              fontWeight: "300",
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      </View>
      <Switch
        trackColor={{
          false: GlobalStyles.colors.gray500,
          true: GlobalStyles.colors.primary500,
        }}
        thumbColor={
          state
            ? GlobalStyles.colors.backgroundColor
            : GlobalStyles.colors.gray500Accent
        }
        onValueChange={toggleState}
        value={state}
        style={[{ marginBottom: verticalScale(8) }, GlobalStyles.shadowPrimary]}
      />
      {/* </LinearGradient> */}
    </Pressable>
  );
};
export default SettingsSwitch;

SettingsSwitch.propTypes = {
  style: PropTypes.object,
  toggleState: PropTypes.func.isRequired,
  state: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  labelStyle: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: dynamicScale(16, false, 0.5),
    marginBottom: verticalScale(16),
  },
});
