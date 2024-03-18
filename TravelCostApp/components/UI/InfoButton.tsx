import { StyleSheet, Text } from "react-native";
import React from "react";
import { Pressable } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import { moderateScale } from "../../util/scalingUtil";

const InfoButton = ({ containerStyle, onPress }) => {
  return (
    <Pressable
      style={[styles.container, GlobalStyles.strongShadow, containerStyle]}
      onPress={onPress}
    >
      <Text style={styles.text}>i</Text>
    </Pressable>
  );
};

export default InfoButton;

InfoButton.propTypes = {
  containerStyle: PropTypes.object,
  onPress: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: moderateScale(50),
    width: moderateScale(20),
    height: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: moderateScale(12),
    fontWeight: "bold",
  },
});
