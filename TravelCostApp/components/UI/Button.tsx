import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

const Button = ({
  children,
  onPress,
  mode = "",
  style = {},
  buttonStyle = {},
}) => {
  const onPressHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
    return;
  };
  return (
    <View style={style}>
      <Pressable
        onPress={onPressHandler}
        style={({ pressed }) => [
          styles.button,
          buttonStyle,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
      >
        <View style={mode === "flat" && styles.flat}>
          <Text
            style={[
              GlobalStyles.buttonTextPrimary,
              mode === "flat" && styles.flatText,
            ]}
          >
            {children}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 16,
    elevation: 3,
    overflow: "visible",
    padding: 16,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  flat: {
    // TODO: find another way android
    // backgroundColor: "transparent",
  },
  flatText: {
    color: GlobalStyles.colors.primary200,
  },
  pressed: {
    backgroundColor: GlobalStyles.colors.primary100,
    borderRadius: 16,
    opacity: 0.75,
    shadowColor: GlobalStyles.colors.backgroundColor,
    shadowRadius: 0,
    transform: [{ scale: 0.9 }],
  },
});
