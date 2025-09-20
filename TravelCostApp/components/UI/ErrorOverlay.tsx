import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import Button from "./Button";
import PropTypes from "prop-types";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

const ErrorOverlay = ({ message, onConfirm }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, styles.title]}>{i18n.t("anErrorOccurred")}</Text>
      <Text style={styles.text}>{message}</Text>
      <Button onPress={onConfirm}>{i18n.t("okay")}</Button>
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
