import { StyleSheet, Text } from "react-native";
import React from "react";
import { Pressable } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import { dynamicScale } from "../../util/scalingUtil";

const InfoButton = ({
  containerStyle,
  onPress,
  testID,
  accessibilityLabel,
}) => {
  return (
    <Pressable
      style={[styles.container, containerStyle]}
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Text style={styles.text}>i</Text>
    </Pressable>
  );
};

export default InfoButton;

InfoButton.propTypes = {
  containerStyle: PropTypes.object,
  onPress: PropTypes.func.isRequired,
  testID: PropTypes.string,
  accessibilityLabel: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: dynamicScale(50, false, 0.5),
    width: dynamicScale(20, false, 0.5),
    height: dynamicScale(20, false, 0.5),
    alignItems: "center",
    justifyContent: "center",
    ...GlobalStyles.strongShadow,
  },
  text: {
    fontSize: dynamicScale(12, false, 0.5),
    fontWeight: "bold",
  },
});
