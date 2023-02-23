import { StyleSheet, Text, View } from "react-native";
import React from "react";
import PropTypes from "prop-types";
import Button from "../components/UI/Button";
import FlatButton from "../components/UI/FlatButton";

const ManageCategoryScreen = (props) => {
  const { storeCatlist, navigation } = props;
  console.log("ManageCategoryScreen ~ storeCatlist:", storeCatlist);
  return (
    <View style={styles.container}>
      <Text>Icon</Text>
      <Text>Name</Text>
      <Text>Color</Text>
      <FlatButton onPress={navigation.popToTop}>Cancel</FlatButton>
      <Button onPress={navigation.popToTop}>Add</Button>
    </View>
  );
};

export default ManageCategoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
