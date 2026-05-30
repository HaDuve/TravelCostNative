import { StyleSheet, Text, View, Pressable } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import PropTypes from "prop-types";
import { dynamicScale } from "../../util/scalingUtil";

const GradientButton = ({
  children,
  onPress,
  buttonStyle,
  darkText = false,
  textStyle = {},
  style = {},
  colors = GlobalStyles.gradientPrimaryButton,
}) => {
  const onPressHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
    return;
  };
  return (
    <View testID="gradient-button-layout" style={style}>
      <View
        testID="gradient-button-shadow"
        style={[
          shadowRegressionStyles.gradientButtonShadow,
          { backgroundColor: colors[colors.length - 1] },
        ]}
      >
        <Pressable
          onPress={onPressHandler}
          style={({ pressed }) => [
            styles.pressable,
            pressed && GlobalStyles.pressedWithShadow,
          ]}
        >
          <LinearGradient
            start={{ x: 0.51, y: -1.3 }}
            colors={colors}
            style={[styles.button, styles.gradientFill, buttonStyle]}
          >
            <Text
              style={[
                GlobalStyles.buttonTextGradient,
                darkText && { color: GlobalStyles.colors.textColor },
                textStyle,
              ]}
            >
              {children}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

export default GradientButton;
GradientButton.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func.isRequired,
  buttonStyle: PropTypes.object,
  textStyle: PropTypes.object,
  darkText: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  colors: PropTypes.array,
};

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "stretch",
  },
  button: {
    padding: dynamicScale(16, false, 0.5),
  },
  gradientFill: {
    borderRadius: 16,
    overflow: "hidden",
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
