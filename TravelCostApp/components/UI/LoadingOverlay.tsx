import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import { GlobalStyles } from "../../constants/styles";

//localization

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { dynamicScale } from "../../util/scalingUtil";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
// i18n.locale = "en";
i18n.enableFallback = true;

const loadingColor = GlobalStyles.colors.primaryGrayed;
const LoadingOverlay = props => {
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

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flex: 1,
    justifyContent: "center",
    marginTop: dynamicScale(4, true),
    padding: dynamicScale(12),
  },
  text: {
    color: loadingColor,
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "300",
    marginTop: dynamicScale(12, true),
  },
});
