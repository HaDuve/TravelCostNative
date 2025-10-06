import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { ButtonProps } from "../../types/components";

function FlatButton({
  children,
  onPress,
  textStyle = {},
  buttonStyle = {},
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        buttonStyle,
        pressed && GlobalStyles.pressed,
      ]}
      onPress={onPress}
    >
      <View>
        <Text style={[GlobalStyles.buttonTextFlat, textStyle]}>{children}</Text>
      </View>
    </Pressable>
  );
}

export default FlatButton;

const styles = StyleSheet.create({
  button: {
    padding: 12,
  },
  pressed: {
    opacity: 0.5,
  },
});
