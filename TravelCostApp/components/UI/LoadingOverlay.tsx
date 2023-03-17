import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";

//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

const loadingColor = GlobalStyles.colors.primaryGrayed;
const LoadingOverlay = (containerStyle) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={"large"} color={loadingColor} />
      <Text style={styles.text}>{i18n.t("loadingYourTrip")}</Text>
    </View>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  text: {
    color: loadingColor,
    fontSize: 18,
    fontWeight: "300",
    marginTop: 12,
  },
});
