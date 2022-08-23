import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, GlobalStyles } from "../../constants/styles";

function FlatButton({ children, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View>
        <Text style={GlobalStyles.buttonTextFlat}>{children}</Text>
      </View>
    </Pressable>
  );
}

export default FlatButton;

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.5,
  },
});
