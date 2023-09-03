import React from "react";
import { countryToAlpha2 } from "country-to-iso";
import CountryFlag from "react-native-country-flag";
import PropTypes from "prop-types";
import { View, StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";

const ExpenseCountryFlag = ({ countryName, style, containerStyle }) => {
  if (!countryName) return <></>;
  const countryCode = countryToAlpha2(countryName);
  if (!countryCode) return <></>;
  return (
    <View style={[styles.container, containerStyle]}>
      <CountryFlag isoCode={countryCode} size={20} style={style} />
    </View>
  );
};

export default ExpenseCountryFlag;
ExpenseCountryFlag.propTypes = {
  countryName: PropTypes.string,
  style: PropTypes.object,
  containerStyle: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
