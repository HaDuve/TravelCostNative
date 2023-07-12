import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
import BackgroundGradient from "./BackgroundGradient";
import { LinearGradient } from "expo-linear-gradient";
import PropTypes from "prop-types";

const GradientButton = ({
  children,
  onPress,
  buttonStyle,
  darkText = false,
  style = {},
  colors = GlobalStyles.gradientPrimaryButton,
}) => {
  const onPressHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
    return;
  };
  return (
    <View style={[style, GlobalStyles.shadowPrimary]}>
      <Pressable
        onPress={onPressHandler}
        style={({ pressed }) => [pressed && GlobalStyles.pressedWithShadow]}
      >
        <LinearGradient
          start={{ x: 0.51, y: -1.3 }}
          colors={colors}
          style={[styles.button, buttonStyle, { overflow: "hidden" }]}
        >
          <Text
            style={[
              GlobalStyles.buttonTextGradient,
              darkText && { color: GlobalStyles.colors.textColor },
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
GradientButton.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func.isRequired,
  buttonStyle: PropTypes.object,
  darkText: PropTypes.bool,
  style: PropTypes.object,
  colors: PropTypes.array,
};

const styles = StyleSheet.create({
  button: {
    padding: 16,
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 16,

    overflow: "visible",

    ...Platform.select({
      ios: {
        shadowColor: GlobalStyles.colors.textColor,
        shadowRadius: 3,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  flat: {
    // TODO: find another way android
    // backgroundColor: "transparent",
  },
  flatText: {
    color: GlobalStyles.colors.primary200,
  },
  pressed: {
    elevation: 0,
    transform: [{ scale: 0.9 }],
    opacity: 0.75,
    backgroundColor: GlobalStyles.colors.primary100,
    borderRadius: 16,
    shadowColor: GlobalStyles.colors.backgroundColor,
    shadowRadius: 0,
  },
});
