import { StyleSheet, Text, View } from "react-native";
import React from "react";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";
import { useGlobalStyles } from "../../store/theme-context";

const Discount = ({ discountPercentage, style }) => {
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.discountText}>
        Save {discountPercentage}% to Monthly!
      </Text>
    </View>
  );
};

export default Discount;

Discount.propTypes = {
  discountPercentage: PropTypes.number.isRequired,
  style: PropTypes.object,
};

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
  container: {
    borderWidth: 4,
    borderColor: GlobalStyles.colors.cat1,
    borderRadius: 10,
    // backgroundColor: GlobalStyles.colors.backgroundColor,
    //rotate
    transform: [{ rotate: "22deg" }],
    padding: 4,
    position: "absolute",
    top: "-40%",
    left: "41%",
  },
  discountText: {
    fontSize: 20,
    fontWeight: "bold",
    color: GlobalStyles.colors.cat1,
  },
});
