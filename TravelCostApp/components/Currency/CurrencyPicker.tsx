import { StyleSheet, Modal, TextInput, View, Text } from "react-native";

import React from "react";
import DropDownPicker from "react-native-dropdown-picker";
import * as i18nIsoCountries from "i18n-iso-countries";
import { useState } from "react";

import { GlobalStyles } from "../../constants/styles";

const CurrencyPicker = ({ countryValue, setCountryValue, onChangeValue }) => {
  // Users Device CountryCode CC to translate Country names in picker

  const countryToCurrency = require("country-to-currency");

  var countries = require("i18n-iso-countries");

  i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));
  const countryOptions = Object.keys(countries.getNames("en")).map((code) => ({
    label: `${countryToCurrency[code]} - ${countries.getName(code, "en")}`,
    value: `${countryToCurrency[code]} - ${countries.getName(code, "en")}`,
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
        placeholder={"Currency"}
        containerStyle={{
          backgroundColor: GlobalStyles.colors.gray500,
        }}
        style={{
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
