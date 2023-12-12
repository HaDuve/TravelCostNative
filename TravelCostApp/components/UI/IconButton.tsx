import React, { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";
import { Badge } from "react-native-paper";

const IconButton = ({
  icon,
  size,
  color,
  badge,
  badgeText,
  badgeStyle,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  buttonStyle = {},
  onPressStyle = {},
}) => {
  const content = <Ionicons name={icon} size={size} color={color} />;
  const badgeJSX = badge ? (
    <View style={{ marginBottom: (-1 * size) / 4 }}>
      <Badge style={badgeStyle} size={size / 4}>
        {badgeText}
      </Badge>
    </View>
  ) : (
    <></>
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.buttonContainer,
        buttonStyle,
        pressed && styles.pressed,
        pressed && onPressStyle,
      ]}
    >
      {badgeJSX}
      {content}
    </Pressable>
  );
};

export default IconButton;

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  badge: PropTypes.bool,
  badgeText: PropTypes.string,
  badgeStyle: PropTypes.object,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
  onLongPress: PropTypes.func,
  buttonStyle: PropTypes.any,
  rotate: PropTypes.number,
  onPressStyle: PropTypes.object,
  imageNumber: PropTypes.number,
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 24,
    padding: 8,
  },
  pressed: {
    opacity: 0.75,
    // transform: [{ scale: 0.8 }],
  },
});
