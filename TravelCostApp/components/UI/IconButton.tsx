import React, { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { Badge } from "react-native-paper";
import { useEffect, useState } from "react";
import { getCatSymbolAsync } from "../../util/category";

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
  category,
}) => {
  const [overrideIcon, setCatSymbol] = useState(null);
  useEffect(() => {
    async function setCatSymbolAsync() {
      const newCatSymbol = await getCatSymbolAsync(category);
      setCatSymbol(newCatSymbol);
    }
    if (category) setCatSymbolAsync();
  }, [category]);
  const content = (
    <Ionicons name={overrideIcon ?? icon} size={size} color={color} />
  );
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
  category: PropTypes.string,
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
