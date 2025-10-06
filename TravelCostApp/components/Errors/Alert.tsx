//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { Alert } from "react-native";

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

export function alertYesNo(
  title: string,
  message: string,
  onPressYes,
  onPressNo?
) {
  return Alert.alert(title, message, [
    // The "No" button
    {
      text: i18n.t("no"),
      onPress: () => (onPressNo ? onPressNo() : () => {}),
    },
    // The "Yes" button
    {
      text: i18n.t("yes"),
      onPress: () => onPressYes(),
    },
  ]);
}
