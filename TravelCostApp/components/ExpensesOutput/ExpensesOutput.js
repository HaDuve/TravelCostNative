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

function ExpensesOutput({ expenses, fallbackText, refreshControl }) {
  let content = (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
      <Text style={styles.infoText}>{fallbackText}</Text>
    </Animated.View>
  );
  if (expenses.length > 0) {
    content = <ExpensesList expenses={expenses} />;
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
    overflow: "visible",
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
