//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { Platform, View } from "react-native";
import React, { useContext } from "react";
import DatePicker from "react-native-neat-date-picker";
import { GlobalStyles } from "../../constants/styles";
import { getLocaleDateFormat } from "../../util/date";
import { OrientationContext } from "../../store/orientation-context";
import PropTypes from "prop-types";

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
      // if Localization.locale.slice(0, 2) is one of these, it will be used
      // otherwise, the default language is 'en'
      language={
        Localization.locale.slice(0, 2) === "de" ||
        Localization.locale.slice(0, 2) === "fr"
          ? Localization.locale.slice(0, 2)
          : "en"
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

DatePickerModal.propTypes = {
  showDatePickerRange: PropTypes.bool,
  onCancelRange: PropTypes.func,
  onConfirmRange: PropTypes.func,
};
