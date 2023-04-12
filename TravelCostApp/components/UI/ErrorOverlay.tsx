import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import Button from "./Button";
import PropTypes from "prop-types";

const ErrorOverlay = ({ message, onConfirm }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, styles.title]}>An error occured!</Text>
      <Text style={styles.text}>{message}</Text>
      <Button onPress={onConfirm}>Okay</Button>
    </View>
  );
};

export default ErrorOverlay;
ErrorOverlay.propTypes = {
  message: PropTypes.string,
  onConfirm: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  text: {
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
