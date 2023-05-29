import { StyleSheet, Text, View } from "react-native";
import React from "react";
import PropTypes from "prop-types";

const Discount = ({ discountPercentage, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.discountText}>{discountPercentage}% Discount!</Text>
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
    borderColor: "red",
    borderRadius: 10,
    // backgroundColor: "white",
    //rotate
    transform: [{ rotate: "25deg" }],
    padding: 4,
    position: "absolute",
    top: "-30%",
    left: "61%",
  },
  discountText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
  },
});
