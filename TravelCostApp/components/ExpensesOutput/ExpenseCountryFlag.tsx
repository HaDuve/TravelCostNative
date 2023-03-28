import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { countryToAlpha2, countryToAlpha3 } from "country-to-iso";
import CountryFlag from "react-native-country-flag";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";

const ExpenseCountryFlag = ({ countryName, style }) => {
  if (!countryName) return <></>;
  const countryCode = countryToAlpha2(countryName);
  if (!countryCode) return <></>;
  return <CountryFlag isoCode={countryCode} size={20} style={[style]} />;
};

export default ExpenseCountryFlag;
ExpenseCountryFlag.propTypes = {
  countryName: PropTypes.string.isRequired,
  style: PropTypes.object,
};

const styles = StyleSheet.create({});
