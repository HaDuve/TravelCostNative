import { Alert } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

export function alertNoYes(
  title: string,
  message: string,
  onPressNo?: Function,
  onPressYes?: Function
) {
  return Alert.alert(title, message, [
    // The "No" button
    // Does nothing but dismiss the dialog when tapped
    {
      text: i18n.t("no"),
      onPress: () => onPressNo,
    },
    // The "Yes" button
    {
      text: i18n.t("yes"),
      onPress: () => onPressYes,
    },
  ]);
}
