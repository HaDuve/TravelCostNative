import { StyleSheet, Text, View, Pressable, Linking } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import GradientButton from "./GradientButton";

const LinkingButton = ({
  children,
  URL,
  mode = "",
  style = {},
  buttonStyle = {},
}) => {
  const handleClick = () => {
    Linking.canOpenURL(URL).then((supported) => {
      if (supported) {
        Linking.openURL(URL);
      } else {
        console.log("Don't know how to open URI: " + URL);
      }
    });
  };
  return (
    <GradientButton onPress={handleClick} style={style}>
      {children}
    </GradientButton>
  );
};

export default LinkingButton;

const styles = StyleSheet.create({
  button: {
    padding: 16,
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 16,
    elevation: 3,
    shadowColor: GlobalStyles.colors.primary800,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 4 },
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
