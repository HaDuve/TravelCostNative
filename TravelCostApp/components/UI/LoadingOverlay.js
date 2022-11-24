import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";

const LoadingOverlay = (containerStyle) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={"large"} color={"black"} />
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
});
