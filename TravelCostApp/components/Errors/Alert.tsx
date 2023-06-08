import { Alert } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
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
