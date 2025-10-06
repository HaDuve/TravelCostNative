//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { useContext } from "react";
import { Platform, View } from "react-native";
import DatePicker from "react-native-neat-date-picker";

import { GlobalStyles } from "../../constants/styles";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { OrientationContext } from "../../store/orientation-context";
import { getLocaleDateFormat } from "../../util/date";

const DatePickerModal = ({
  showDatePickerRange,
  onCancelRange,
  onConfirmRange,
}) => {
  const dateStringFormatLocale = getLocaleDateFormat();
  const android = Platform.OS === "android";
  const { height } = useContext(OrientationContext);
  const datepickerJSX = (
    <DatePicker
      dateStringFormat={dateStringFormatLocale}
      isVisible={showDatePickerRange}
      mode={"range"}
      colorOptions={{
        headerColor: GlobalStyles.colors.primaryGrayed,
        headerTextColor: GlobalStyles.colors.backgroundColor,
        backgroundColor: GlobalStyles.colors.backgroundColor,
        changeYearModalColor: GlobalStyles.colors.backgroundColor,
        selectedDateTextColor: GlobalStyles.colors.backgroundColor,
        dateTextColor: GlobalStyles.colors.textColor,
        selectedDateBackgroundColor: GlobalStyles.colors.primaryGrayed,
        confirmButtonColor: GlobalStyles.colors.primary700,
        weekDaysColor: GlobalStyles.colors.primary700,
      }}
      onCancel={onCancelRange}
      onConfirm={onConfirmRange}
      // @enum 'en' | 'cn' | 'de' | 'es' | 'fr' | 'pt'
      // if ((Localization.getLocales()[0]&&Localization.getLocales()[0].languageCode)?Localization.getLocales()[0].languageCode.slice(0,2):'en') is one of these, it will be used
      // otherwise, the default language is 'en'
      language={
        (() => {
          const lang =
            Localization.getLocales()[0] &&
            Localization.getLocales()[0].languageCode
              ? Localization.getLocales()[0].languageCode.slice(0, 2)
              : "en";
          return lang === "de" || lang === "fr" ? lang : "en";
        })() as "en" | "cn" | "de" | "es" | "fr" | "pt"
      }
    />
  );
  if (android)
    return (
      <View style={showDatePickerRange && { minHeight: height }}>
        {datepickerJSX}
      </View>
    );
  return datepickerJSX;
};

export default DatePickerModal;
