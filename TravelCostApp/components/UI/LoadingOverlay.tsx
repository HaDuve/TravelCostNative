import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";

const loadingColor = GlobalStyles.colors.primaryGrayed;
const LoadingOverlay = (containerStyle) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={"large"} color={loadingColor} />
      <Text style={styles.text}>{"Loading your Trip ... "}</Text>
    </View>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  text: {
    color: loadingColor,
    fontSize: 18,
    fontWeight: "300",
    marginTop: 12,
  },
});
