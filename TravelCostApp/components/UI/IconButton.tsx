import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { Badge } from "react-native-paper";

import { getCatSymbolMMKV } from "../../util/category";

export type IconButtonProps = {
  icon: string;
  size?: number;
  color?: string;
  badge?: boolean;
  badgeText?: string;
  badgeStyle?: ViewStyle;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  buttonStyle?: any;
  onPressStyle?: ViewStyle;
  category?: string;
};

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
}: IconButtonProps) => {
  const [overrideIcon, setCatSymbol] = useState(null);
  useEffect(() => {
    async function setCatSymbolAsync() {
      const newCatSymbol = getCatSymbolMMKV(category);
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
