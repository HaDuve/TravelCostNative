import { StyleSheet, Text, View } from "react-native";
import React from "react";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";

const Discount = ({ discountPercentage, style }) => {
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

const styles = StyleSheet.create({
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
