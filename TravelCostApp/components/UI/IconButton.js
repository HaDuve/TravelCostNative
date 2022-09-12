import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const IconButton = ({ icon, size, color, onPress, buttonStyle, rotate }) => {
  let transformStyle = {};
  if (rotate) {
    transformStyle = { transform: [{ rotateY: "180deg" }] };
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={[styles.buttonContainer, buttonStyle]}>
        <Ionicons
          name={icon}
          size={size}
          color={color}
          style={transformStyle}
        />
      </View>
    </Pressable>
  );
};

export default IconButton;

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
