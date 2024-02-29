import { StyleSheet, Text } from "react-native";
import React from "react";
import { Pressable } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";

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
    borderRadius: 50,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
