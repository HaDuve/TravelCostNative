import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "./IconButton";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import * as Haptics from "expo-haptics";

const BackButton = ({ style }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[GlobalStyles.backButton, style]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.goBack();
      }}
    >
      <IconButton
        icon="arrow-back-outline"
        size={24}
        color={GlobalStyles.colors.textColor}
      ></IconButton>
    </TouchableOpacity>
  );
};

export default BackButton;

BackButton.propTypes = {
  style: PropTypes.object,
};

const styles = StyleSheet.create({});
