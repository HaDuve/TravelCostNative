import { StyleSheet, Text, View, Pressable } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";

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
        <View style={[mode === "flat" && styles.flat]}>
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
    padding: 16,
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 16,
    elevation: 3,
    shadowColor: GlobalStyles.colors.textColor,
    shadowRadius: 3,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    overflow: "visible",
  },
  flat: {
    // TODO: find another way android
    // backgroundColor: "transparent",
  },
  flatText: {
    color: GlobalStyles.colors.primary200,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.75,
    backgroundColor: GlobalStyles.colors.primary100,
    borderRadius: 16,
    shadowColor: GlobalStyles.colors.backgroundColor,
    shadowRadius: 0,
  },
});
