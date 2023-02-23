import { StyleSheet, Text, View } from "react-native";
import React from "react";
import PropTypes from "prop-types";

const ManageCategoryScreen = (props) => {
  const { storeCatlist } = props;
  console.log("ManageCategoryScreen ~ storeCatlist:", storeCatlist);
  return (
    <View>
      <Text>ManageCategoryScreen</Text>
    </View>
  );
};

export default ManageCategoryScreen;

const styles = StyleSheet.create({});
