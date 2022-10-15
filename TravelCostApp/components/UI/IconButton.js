import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const IconButton = ({
  icon,
  size,
  color,
  onPress,
  buttonStyle,
  rotate,
  onPressStyle,
  imageNumber,
}) => {
  let transformStyle = {};
  if (rotate) {
    transformStyle = { transform: [{ rotateY: "180deg" }] };
  }
  let content = (
    <Ionicons name={icon} size={size} color={color} style={transformStyle} />
  );
  if (imageNumber === 1)
    content = (
      <Image
        style={[transformStyle, buttonStyle]}
        source={require("../../assets/overviewButtonToggleOn.png")}
      />
    );
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && [styles.pressed, onPressStyle]}
    >
      {content}
      <View style={[styles.buttonContainer, buttonStyle]}></View>
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
