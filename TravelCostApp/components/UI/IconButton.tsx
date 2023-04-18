import React, { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";

const IconButton = ({
  icon,
  size,
  color,
  onPress,
  onLongPress,
  buttonStyle = {},
  onPressStyle = {},
}) => {
  const content = <Ionicons name={icon} size={size} color={color} />;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => pressed && [styles.pressed, onPressStyle]}
    >
      {content}
      <View style={[styles.buttonContainer, buttonStyle]}></View>
    </Pressable>
  );
};

export default IconButton;

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  onLongPress: PropTypes.func,
  buttonStyle: PropTypes.object,
  rotate: PropTypes.number,
  onPressStyle: PropTypes.object,
  imageNumber: PropTypes.number,
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 24,
    padding: 6,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
