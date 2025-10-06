import { countryToAlpha2 } from "country-to-iso";
import { StyleSheet, View } from "react-native";
import CountryFlag from "react-native-country-flag";

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

const styles = StyleSheet.create({
  container: {
    // backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
