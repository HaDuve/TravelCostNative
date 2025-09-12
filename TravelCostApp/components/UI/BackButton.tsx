import { Platform, Pressable } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "./IconButton";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import * as Haptics from "expo-haptics";
import { dynamicScale } from "../../util/scalingUtil";

const BackButton = ({ style }) => {
  const navigation = useNavigation();
  if (Platform.OS === "android") {
    return <></>;
  }
  return (
    <Pressable
      style={[GlobalStyles.backButton, style]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.goBack();
      }}
    >
      <IconButton
        icon="arrow-back-outline"
        size={dynamicScale(24, false, 0.5)}
        color={GlobalStyles.colors.textColor}
      ></IconButton>
    </Pressable>
  );
};

export default BackButton;

BackButton.propTypes = {
  style: PropTypes.object,
};
