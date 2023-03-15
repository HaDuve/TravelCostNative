import { StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { GlobalStyles } from "../../constants/styles";
import ExpensesList from "./ExpensesList";
import React from "react-native";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import LoadingOverlay from "../UI/LoadingOverlay";
import SplashScreenOverlay from "../UI/SplashScreenOverlay";
import { useEffect, useState } from "react";

function ExpensesOutput({
  expenses,
  fallbackText,
  refreshControl,
  periodValue,
}) {
  const [showLoading, setShowLoading] = useState(true);
  useEffect(() => {
    setTimeout(toggleLoading, 3000);
  }, []);

  const toggleLoading = () => setShowLoading((prev) => !prev);

  let content = (
    <Animated.View exiting={SlideOutLeft}>
      {showLoading && <LoadingOverlay></LoadingOverlay>}
      {!showLoading && <Text style={styles.infoText}>{fallbackText}</Text>}
    </Animated.View>
  );
  if (expenses.length > 0) {
    content = <ExpensesList periodValue={periodValue} expenses={expenses} />;
  }
  return (
    <ScrollView style={styles.container} refreshControl={refreshControl}>
      <View>{content}</View>
    </ScrollView>
  );
}

export default ExpensesOutput;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
  },
  infoText: {
    color: GlobalStyles.colors.textColor,
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
});
