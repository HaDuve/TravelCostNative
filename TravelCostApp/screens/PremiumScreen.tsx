import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Offerings from "../components/Premium/Offerings";
import Button from "../components/UI/Button";

const PremiumScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Offerings></Offerings>
      <Button onPress={() => navigation.pop()}>Back</Button>
    </View>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
