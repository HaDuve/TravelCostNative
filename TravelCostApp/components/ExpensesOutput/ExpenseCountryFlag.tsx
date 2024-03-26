import React from "react";
import { countryToAlpha2 } from "country-to-iso";
import CountryFlag from "react-native-country-flag";
import PropTypes from "prop-types";
import { View, StyleSheet } from "react-native";
import { dynamicScale } from "../../util/scalingUtil";

const ExpenseCountryFlag = ({ countryName, style, containerStyle }) => {
  if (!countryName) return <></>;
  const countryCode = countryToAlpha2(countryName);
  if (!countryCode) return <></>;
  return (
    <View style={[styles.container, containerStyle]}>
      <CountryFlag
        isoCode={countryCode}
        size={dynamicScale(20, false, 0.5)}
        style={style}
      />
    </View>
  );
};

export default ExpenseCountryFlag;
ExpenseCountryFlag.propTypes = {
  countryName: PropTypes.string,
  style: PropTypes.object,
  containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
