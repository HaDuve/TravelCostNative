import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "./IconButton";
import { useNavigation } from "@react-navigation/native";

const BackButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={GlobalStyles.backButton} onPress={navigation.pop}>
      <IconButton
        icon="arrow-back-outline"
        size={24}
        color={GlobalStyles.colors.textColor}
      ></IconButton>
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({});
