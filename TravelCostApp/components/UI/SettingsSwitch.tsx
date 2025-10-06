import PropTypes from "prop-types";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

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
        style={[
          { marginBottom: dynamicScale(8, true) },
          GlobalStyles.shadowPrimary,
        ]}
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
    alignItems: "center",
    borderBottomColor: GlobalStyles.colors.gray500,
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "2%",
    paddingHorizontal: "4%",
  },
  label: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    marginBottom: dynamicScale(16, true),
  },
});
