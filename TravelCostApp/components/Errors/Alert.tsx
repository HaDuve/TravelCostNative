import { Alert } from "react-native";

import { i18n } from "../../i18n/i18n";

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
