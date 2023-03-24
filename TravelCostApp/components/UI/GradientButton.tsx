import { StyleSheet, Text, View, Pressable } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
import BackgroundGradient from "./BackgroundGradient";
import { LinearGradient } from "expo-linear-gradient";

const GradientButton = ({
  children,
  onPress,
  mode = "",
  style = {},
  colors = GlobalStyles.gradientColorsButton,
}) => {
  const onPressHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
    return;
  };
  return (
    <View style={[style]}>
      <Pressable
        onPress={onPressHandler}
        style={({ pressed }) => [pressed && GlobalStyles.pressedWithShadow]}
      >
        <LinearGradient
          start={{ x: 0.51, y: -1.3 }}
          colors={colors}
          style={[styles.button]}
        >
          <Text
            style={[
              GlobalStyles.buttonTextGradient,
              mode === "flat" && styles.flatText,
            ]}
          >
            {children}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

export default GradientButton;

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
