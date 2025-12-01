import { StyleSheet, Text } from "react-native";
import React from "react";
import { Pressable } from "react-native";
import { useGlobalStyles } from "../../store/theme-context";
import PropTypes from "prop-types";
import { dynamicScale } from "../../util/scalingUtil";

const InfoButton = ({ containerStyle, onPress }) => {
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
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

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
    container: {
      backgroundColor: GlobalStyles.colors.backgroundColorLight,
      borderRadius: dynamicScale(50, false, 0.5),
      width: dynamicScale(20, false, 0.5),
      height: dynamicScale(20, false, 0.5),
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontSize: dynamicScale(12, false, 0.5),
      fontWeight: "bold",
      color: GlobalStyles.colors.textColor,
    },
  });
