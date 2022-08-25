import { StyleSheet, Text, View } from "react-native";
import React from "react";
import IconButton from "../components/UI/IconButton";
import { GlobalStyles } from "../constants/styles";

const CategoryPickScreen = ({ route, navigation }) => {
  return (
    <View style={styles.container}>
      <Text>CategoryPickScreen</Text>
      <IconButton
        icon={"airplane-outline"}
        size={34}
        color={GlobalStyles.colors.accent500}
      ></IconButton>
    </View>
  );
};

export default CategoryPickScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
  },
});
