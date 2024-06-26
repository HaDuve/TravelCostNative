import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import React from "react";
import { GlobalStyles } from "../../constants/styles";

//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import PropTypes from "prop-types";
import { dynamicScale } from "../../util/scalingUtil";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

const loadingColor = GlobalStyles.colors.primaryGrayed;
const LoadingOverlay = (props) => {
  const { containerStyle, customText, noText, size = "large" } = props;
  const string =
    customText && customText?.length > 0
      ? customText
      : i18n.t("loadingYourTrip");
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={loadingColor} />
      {!noText && <Text style={styles.text}>{string}</Text>}
    </View>
  );
};

export default LoadingOverlay;

LoadingOverlay.propTypes = {
  containerStyle: PropTypes.object,
  customText: PropTypes.string,
  noText: PropTypes.bool,
  size: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: dynamicScale(12),
    marginTop: dynamicScale(4, true),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  text: {
    color: loadingColor,
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "300",
    marginTop: dynamicScale(12, true),
  },
});
