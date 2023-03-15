import { StyleSheet, Modal, TextInput, View, Text } from "react-native";

import React from "react";
import DropDownPicker from "react-native-dropdown-picker";
import * as i18nIsoCountries from "i18n-iso-countries";
import { useState } from "react";

import { GlobalStyles } from "../../constants/styles";
//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
import LoadingOverlay from "../UI/LoadingOverlay";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

const CurrencyPicker = ({
  countryValue,
  setCountryValue,
  onChangeValue,
  placeholder,
}) => {
  // Users Device CountryCode CC to translate Country names in picker
  // enforce a language we have registered, otherwise, english
  var CC = Localization.locale.slice(0, 2);
  if (CC !== "de" && CC !== "en") CC = "en";

  const countryToCurrency = require("country-to-currency");
  var countries = require("i18n-iso-countries");
  i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));
  i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/de.json"));

  const countryOptions = Object.keys(countries.getNames("en")).map((code) => ({
    label: `${countryToCurrency[code]} - ${countries.getName(code, CC)}`,
    value: `${countryToCurrency[code]} - ${countries.getName(code, CC)}`,
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
        setOpen={setOpen}
        onChangeValue={onChangeValue}
        setValue={setCountryValue}
        setItems={setItems}
        placeholder={placeholder ? placeholder : i18n.t("currencyLabel")}
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
          backgroundColor: GlobalStyles.colors.gray500,
          borderColor: GlobalStyles.colors.gray700,
        }}
        textStyle={{ color: GlobalStyles.colors.textColor }}
      />
    </View>
  );
};

export default CurrencyPicker;

const styles = StyleSheet.create({
  container: { flex: 1, margin: 10 },
  dropDownPickerContainer: {},
  dropDownPicker: {},
  dropDownPickerText: {},
});
