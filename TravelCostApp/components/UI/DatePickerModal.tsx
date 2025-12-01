import * as Localization from "expo-localization";

import { Platform, View } from "react-native";
import React, { useContext } from "react";
import DatePicker from "react-native-neat-date-picker";
import { useGlobalStyles } from "../../store/theme-context";
import { getLocaleDateFormat } from "../../util/date";
import { OrientationContext } from "../../store/orientation-context";
import PropTypes from "prop-types";

const DatePickerModal = ({
  showDatePickerRange,
  onCancelRange,
  onConfirmRange,
}) => {
  const GlobalStyles = useGlobalStyles();
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
        (Localization.getLocales()[0] &&
        Localization.getLocales()[0].languageCode
          ? Localization.getLocales()[0].languageCode.slice(0, 2)
          : "en") === "de" ||
        (Localization.getLocales()[0] &&
        Localization.getLocales()[0].languageCode
          ? Localization.getLocales()[0].languageCode.slice(0, 2)
          : "en") === "fr"
          ? ((Localization.getLocales()[0] &&
            Localization.getLocales()[0].languageCode
              ? Localization.getLocales()[0].languageCode.slice(0, 2)
              : "en") as "de" | "fr" | "en")
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
