/* eslint-disable @typescript-eslint/no-var-requires */
import { StyleSheet, View } from "react-native";

import React, { useMemo, useState, useEffect, useContext } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import * as i18nIsoCountries from "i18n-iso-countries";

import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import * as Localization from "expo-localization";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import {
  addRecentCurrency,
  getRecentCurrencies,
  initializeRecentCurrencies,
} from "../../store/mmkv";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";

const countryToCurrency = require("country-to-currency");
const countries = require("i18n-iso-countries");

i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));
i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/de.json"));
i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/fr.json"));
i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/ru.json"));

const CurrencyPicker = ({
  countryValue,
  setCountryValue,
  onChangeValue,
  placeholder,
  valid = true,
}) => {
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);

  const CC = useMemo(() => {
    const locale = Localization.getLocales()[0]?.languageCode ?? "en";
    const normalized = locale.slice(0, 2);
    return ["de", "en", "fr", "ru"].includes(normalized) ? normalized : "en";
  }, []);

  const homeCurrency = useMemo(() => {
    const localeCurrency = Localization.getLocales()[0]?.currencyCode;
    return localeCurrency || tripCtx.tripCurrency || "USD";
  }, [tripCtx.tripCurrency]);

  const allCountryOptions = useMemo(() => {
    const nonEnglish = CC !== "en";
    const nonEnglishCountryString = (code: string) =>
      nonEnglish ? ` - ${countries.getName(code, CC)}` : "";

    return Object.keys(countries.getNames("en")).map((code) => {
      const label = `${countryToCurrency[code]} | ${getCurrencySymbol(
        countryToCurrency[code]
      )} - ${countries.getName(code, "en")}${nonEnglishCountryString(code)}`;

      return {
        label,
        value: label,
        currencyCode: countryToCurrency[code],
      };
    });
  }, [CC]);

  // Initialize recent currencies from trip if empty
  useEffect(() => {
    if (tripCtx.tripCurrency) {
      initializeRecentCurrencies(tripCtx.tripCurrency);
    }
  }, [tripCtx.tripCurrency]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const memoizedItems = useMemo(() => {
    // refreshTrigger is intentionally referenced to rebuild the list after updates
    void refreshTrigger;

    const preferredCurrencyCodes = [
      tripCtx.tripCurrency,
      homeCurrency,
      userCtx.lastCurrency,
      ...getRecentCurrencies(),
    ].filter(Boolean);

    const recentCurrencyCodes = Array.from(new Set(preferredCurrencyCodes));
    const recentItems = recentCurrencyCodes
      .map((currencyCode) =>
        allCountryOptions.find((option) => option.currencyCode === currencyCode)
      )
      .filter(Boolean)
      .map((option) => {
        const shortLabel = `${option.currencyCode} | ${getCurrencySymbol(
          option.currencyCode
        )}`;
        return {
          ...option,
          label: shortLabel,
          value: shortLabel,
        };
      });

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
  }, [
    allCountryOptions,
    homeCurrency,
    refreshTrigger,
    tripCtx.tripCurrency,
    userCtx.lastCurrency,
  ]);

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
        setOpen={setOpen}
        autoScroll
        onOpen={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onSelectItem={(item) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Extract currency from the value string
          const currency = item.value?.split(" | ")[0]?.trim();
          if (currency && item.value !== "__separator__") {
            // Add to recent currencies
            addRecentCurrency(currency);
            // Trigger rebuild of items list
            setRefreshTrigger((prev) => prev + 1);

            trackEvent(VexoEvents.CURRENCY_PICKED, {
              currency: currency,
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

export default CurrencyPicker;

CurrencyPicker.propTypes = {
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
