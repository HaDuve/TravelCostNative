import { Platform, Pressable } from "react-native";
import React from "react";
import { useGlobalStyles } from "../../store/theme-context";
import IconButton from "./IconButton";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import * as Haptics from "expo-haptics";
import { dynamicScale } from "../../util/scalingUtil";

const BackButton = ({ style }) => {
  const navigation = useNavigation();
  const GlobalStyles = useGlobalStyles();
  if (Platform.OS === "android") {
    return <></>;
  }
  const onPressHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };
  return (
    <Pressable
      style={[GlobalStyles.backButton, style]}
      onPress={onPressHandler}
      hitSlop={10}
    >
      <IconButton
        icon="arrow-back-outline"
        size={dynamicScale(24, false, 0.5)}
        color={GlobalStyles.colors.textColor}
        onPress={onPressHandler}
      ></IconButton>
    </Pressable>
  );
};

export default BackButton;

BackButton.propTypes = {
  style: PropTypes.object,
};
