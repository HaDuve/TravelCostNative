import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import PropTypes from "prop-types";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { GradientButtonProps } from "../../types/components";
import { dynamicScale } from "../../util/scalingUtil";

const GradientButton: React.FC<GradientButtonProps> = ({
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
    <View style={[style, GlobalStyles.shadowPrimary]}>
      <Pressable
        onPress={onPressHandler}
        style={({ pressed }) => [pressed && GlobalStyles.pressedWithShadow]}
      >
        <LinearGradient
          start={{ x: 0.51, y: -1.3 }}
          colors={colors as any}
          style={[styles.button, buttonStyle, { overflow: "hidden" }]}
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
  button: {
    backgroundColor: GlobalStyles.colors.primary500,
    marginHorizontal: dynamicScale(4),
    overflow: "visible",

    padding: dynamicScale(16, false, 0.5),

    ...Platform.select({
      ios: {
        shadowColor: GlobalStyles.colors.textColor,
        shadowRadius: 3,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
        borderRadius: 16,
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
    backgroundColor: GlobalStyles.colors.primary100,
    borderRadius: 16,
    elevation: 0,
    opacity: 0.75,
    shadowColor: GlobalStyles.colors.backgroundColor,
    shadowRadius: 0,
    transform: [{ scale: 0.9 }],
  },
});
