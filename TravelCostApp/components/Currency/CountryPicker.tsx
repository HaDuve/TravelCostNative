/* eslint-disable @typescript-eslint/no-var-requires */
import { StyleSheet, Modal, TextInput, View, Text } from "react-native";

import React from "react";
import DropDownPicker from "react-native-dropdown-picker";
import * as i18nIsoCountries from "i18n-iso-countries";
import { useState } from "react";

import { GlobalStyles } from "../../constants/styles";
//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import LoadingOverlay from "../UI/LoadingOverlay";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import { getCurrencySymbol } from "../../util/currencySymbol";
import CountryFlag from "react-native-country-flag";
import ExpenseCountryFlag from "../ExpensesOutput/ExpenseCountryFlag";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

const CountryPicker = ({
  countryValue,
  setCountryValue,
  onChangeValue,
  placeholder,
  valid = true,
}) => {
  // Users Device CountryCode CC to translate Country names in picker
  // enforce a language we have registered, otherwise, english
  let CC = Localization.locale.slice(0, 2);
  if (CC !== "de" && CC !== "en" && CC !== "fr" && CC !== "ru") CC = "en";
  //   const CC = "en";

  const countries = require("i18n-iso-countries");
  i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));
  i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/de.json"));
  i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/fr.json"));
  i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/ru.json"));
  // i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/es.json"));
  // i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/zh.json"));
  // i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/hi.json"));
  // i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/ar.json"));
  // i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/pt.json"));
  // i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/ja.json"));

  const nonEnglish = CC !== "en";
  const nonEnglishCountryString = (code) => {
    if (!nonEnglish) return "";
    return ` - ${nonEnglish && countries.getName(code, CC)}`;
  };

  const countryOptions = Object.keys(countries.getNames("en")).map((code) => ({
    label: `${countries.getName(code, "en")}` + nonEnglishCountryString(code),
    value: `${countries.getName(code, "en")}` + nonEnglishCountryString(code),
    icon: () => (
      <ExpenseCountryFlag
        countryName={code}
        style={GlobalStyles.countryFlagStyleBig}
        containerStyle={GlobalStyles.countryFlagStyleBig}
      />
    ),
  }));

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(countryOptions);

  return (
    <View style={styles.container}>
      <DropDownPicker
        open={open}
        value={countryValue}
        items={items}
        searchable={true}
        listMode="MODAL"
        itemSeparator={true}
        itemSeparatorStyle={{
          backgroundColor: "transparent",
        }}
        setOpen={setOpen}
        onOpen={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onSelectItem={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onChangeValue={onChangeValue}
        modalContentContainerStyle={{
          backgroundColor: GlobalStyles.colors.backgroundColor,
        }}
        modalProps={{
          animationType: "slide",
        }}
        setValue={setCountryValue}
        setItems={setItems}
        placeholder={placeholder ? placeholder : i18n.t("countryLabel")}
        containerStyle={{
          backgroundColor: GlobalStyles.colors.gray500,
          marginHorizontal: "1%",
          paddingHorizontal: "1%",
          paddingRight: "2%",
        }}
        style={{
          paddingLeft: "-20%",
          borderRadius: 0,
          borderWidth: 0,
          borderBottomWidth: 1,
          backgroundColor: valid
            ? GlobalStyles.colors.gray500
            : GlobalStyles.colors.error50,
          borderColor: GlobalStyles.colors.gray700,
        }}
        textStyle={{ color: GlobalStyles.colors.textColor }}
      />
    </View>
  );
};

export default CountryPicker;

CountryPicker.propTypes = {
  countryValue: PropTypes.string.isRequired,
  setCountryValue: PropTypes.func.isRequired,
  onChangeValue: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  valid: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: { flex: 1, margin: 10 },
  dropDownPickerContainer: {},
  dropDownPicker: {},
  dropDownPickerText: {},
});
