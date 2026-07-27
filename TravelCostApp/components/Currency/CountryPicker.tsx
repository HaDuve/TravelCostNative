/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useContext, useMemo, useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";

import DropDownPicker from "react-native-dropdown-picker";
import * as i18nIsoCountries from "i18n-iso-countries";

import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import * as Localization from "expo-localization";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import { ExpensesContext } from "../../store/expenses-context";
import { UserContext } from "../../store/user-context";
import {
  getRecentPickerCountries,
  normalizePickerCountryKey,
} from "../../util/picker-recent-items";

const countries = require("i18n-iso-countries");

i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));
i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/de.json"));
i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/fr.json"));
i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/ru.json"));

const CountryPicker = ({
  countryValue,
  setCountryValue,
  onChangeValue,
  placeholder,
  valid = true,
}) => {
  const expCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);

  const CC = useMemo(() => {
    const locale = Localization.getLocales()[0]?.languageCode ?? "en";
    const normalized = locale.slice(0, 2);
    return ["de", "en", "fr", "ru"].includes(normalized) ? normalized : "en";
  }, []);

  const allCountryOptions = useMemo(() => {
    const nonEnglish = CC !== "en";
    const nonEnglishCountryString = (code: string) =>
      nonEnglish ? ` - ${countries.getName(code, CC)}` : "";

    return Object.keys(countries.getNames("en")).map((code) => {
      const label =
        `${countries.getName(code, "en")}` + nonEnglishCountryString(code);

      return {
        label,
        value: label,
        countryCode: code,
      };
    });
  }, [CC]);

  const memoizedItems = useMemo(() => {
    const recentCountries = getRecentPickerCountries(
      expCtx.expenses,
      userCtx.lastCountry
    );

    const recentItems = recentCountries
      .map((country) => {
        const countryKey = normalizePickerCountryKey(country);
        return allCountryOptions.find(
          (option) => option.countryCode === countryKey
        );
      })
      .filter(Boolean);

    if (recentItems.length === 0) {
      return allCountryOptions;
    }

    return [
      ...recentItems,
      ...(allCountryOptions.length
        ? [
            {
              label: "────────────────────────",
              value: "__separator__",
              disabled: true,
            },
          ]
        : []),
      ...allCountryOptions,
    ];
  }, [allCountryOptions, expCtx.expenses, userCtx.lastCountry]);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(memoizedItems);

  useEffect(() => {
    setItems(memoizedItems);
  }, [memoizedItems]);

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
        onSelectItem={(item) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (item.value && item.value !== "__separator__") {
            trackEvent(VexoEvents.COUNTRY_PICKED, {
              country: item.value,
            });
          }
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
